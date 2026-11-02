import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Flag,
  Lightbulb,
  Award,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Chessboard, MoveOption } from './Chessboard';
import { PlaySetup } from './PlaySetup';
import { Chess, Square } from 'chess.js';
import {
  getComputerMove,
  getThreatenedSquares,
  getTutorHint,
  analyzeMoveQuality,
  findKingSquare,
  getLostPieces,
  getMaterialDifference,
} from '../utils/chessEngine';
import { sound } from '../utils/sound';
import {
  SavedGame,
  UserProgress,
  ActiveGameState,
  loadActiveGame,
  saveActiveGame,
  clearActiveGame,
} from '../utils/storage';
import { ChessPiece, PieceType } from './ChessPiece';

interface PlayViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onAnalyzeGame: (game: SavedGame) => void;
}

type GameMode = SavedGame['mode'];
type Side = 'w' | 'b';
type FinishedResult = 'win' | 'loss' | 'draw';

/** Everything needed to play and record one game; passed explicitly so async callbacks never read stale state. */
interface GameContext {
  mode: GameMode;
  level: number;
  playerColor: Side;
  moves: string[];
  fens: string[];
}

const COMPUTER_THINK_MIN_MS = 400;
const COMPUTER_THINK_JITTER_MS = 300;
const COMPUTER_OPENING_DELAY_MS = 600;
const MAX_SAVED_GAMES = 20;
const BLUNDER_GUARDED_MODES: ReadonlyArray<GameMode> = ['assisted', 'didactic'];

/** Rebuilds a game with full move history (needed for undo and repetition detection). */
function cloneGame(source: Chess): Chess {
  const copy = new Chess();
  for (const san of source.history()) copy.move(san);
  return copy;
}

/** Restores a saved game by replaying its moves; falls back to the bare FEN. */
function restoreGame(state: ActiveGameState): Chess | null {
  try {
    const replayed = new Chess();
    for (const san of state.moves) replayed.move(san);
    if (replayed.fen() === state.fen) return replayed;
    return new Chess(state.fen);
  } catch {
    return null;
  }
}

function playMoveSounds(isCapture: boolean, givesCheck: boolean) {
  if (isCapture) sound.playCapture();
  else sound.playMove();
  if (givesCheck) sound.playCheck();
}

function getModeTitle(mode: GameMode): string {
  if (mode === 'assisted') return 'Partita Assistita';
  if (mode === 'didactic') return 'Partita Didattica';
  if (mode === 'quick') return 'Partita Veloce';
  return 'Partita Libera';
}

function describeDraw(chess: Chess): string {
  if (chess.isStalemate()) return 'Patta per Stallo';
  if (chess.isThreefoldRepetition()) return 'Patta per ripetizione di mosse';
  if (chess.isInsufficientMaterial()) return 'Patta per materiale insufficiente';
  return 'Partita patta';
}

function describeComputerMove(san: string, isCapture: boolean, to: string): string {
  if (isCapture) return `L'avversario ha catturato in ${to}. Osserva come risponde il tuo esercito!`;
  if (san.includes('O-O')) return "L'avversario ha eseguito l'arrocco per mettere al sicuro il proprio Re.";
  return `Mossa avversaria: ${san}. Tocca a te riflettere con calma.`;
}

export const PlayView: React.FC<PlayViewProps> = ({
  progress,
  onUpdateProgress,
  onAnalyzeGame,
}) => {
  // Game setup states
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('assisted');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2);
  const [playerColor, setPlayerColor] = useState<Side>('w');

  // Active game chess instance
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Partita in corso');
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<FinishedResult | null>(null);

  // Assistance toggles
  const [showLegalMoves, setShowLegalMoves] = useState(true);
  const [highlightThreats, setHighlightThreats] = useState(true);
  const [blunderPrevention, setBlunderPrevention] = useState(true);

  // Suggested move and tutor explanation
  const [suggestedMove, setSuggestedMove] = useState<{ from: string; to: string } | null>(null);
  const [tutorMessage, setTutorMessage] = useState<string | null>(null);
  const [blunderWarning, setBlunderWarning] = useState<{
    pendingMove: { from: string; to: string };
    message: string;
  } | null>(null);

  // Move history for analysis
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);

  // Audio / thinking state
  const [isThinking, setIsThinking] = useState(false);

  // Owner of the pending "computer is thinking" timer: always released on reset/unmount.
  const computerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelComputerTimer = useCallback(() => {
    if (computerTimer.current !== null) {
      clearTimeout(computerTimer.current);
      computerTimer.current = null;
    }
    setIsThinking(false);
  }, []);

  useEffect(() => cancelComputerTimer, [cancelComputerTimer]);

  const currentContext = (): GameContext => ({
    mode: gameMode,
    level: difficultyLevel,
    playerColor,
    moves: moveHistory,
    fens: fenHistory,
  });

  const persistActiveGame = (chess: Chess, ctx: GameContext) => {
    saveActiveGame({
      fen: chess.fen(),
      mode: ctx.mode,
      level: ctx.level,
      playerColor: ctx.playerColor,
      moves: ctx.moves,
      fens: ctx.fens,
    });
  };

  const applyAssistanceDefaults = (mode: GameMode) => {
    const assisted = BLUNDER_GUARDED_MODES.includes(mode);
    setShowLegalMoves(assisted);
    setHighlightThreats(assisted);
    setBlunderPrevention(assisted);
    setTutorMessage(
      mode === 'didactic'
        ? 'Inizia sviluppando i pedoni centrali (e4 o d4) e porta in gioco Cavalli e Alfieri!'
        : null
    );
  };

  const executeComputerTurn = (chess: Chess, ctx: GameContext, delayMs = 0) => {
    cancelComputerTimer();
    setIsThinking(true);
    const thinkMs = delayMs + COMPUTER_THINK_MIN_MS + Math.random() * COMPUTER_THINK_JITTER_MS;

    computerTimer.current = setTimeout(() => {
      computerTimer.current = null;
      const compMove = getComputerMove(chess, ctx.level);
      if (!compMove) {
        setIsThinking(false);
        return;
      }

      const isCapture = !!chess.get(compMove.to as Square);
      const nextGame = cloneGame(chess);
      const played = nextGame.move({ from: compMove.from, to: compMove.to, promotion: 'q' });
      const nextCtx: GameContext = {
        ...ctx,
        moves: [...ctx.moves, played.san],
        fens: [...ctx.fens, nextGame.fen()],
      };

      playMoveSounds(isCapture, nextGame.isCheck());

      setLastMove({ from: compMove.from, to: compMove.to });
      setGame(nextGame);
      setMoveHistory(nextCtx.moves);
      setFenHistory(nextCtx.fens);
      if (ctx.mode === 'didactic') {
        setTutorMessage(describeComputerMove(compMove.san, isCapture, compMove.to));
      }

      if (!checkGameEndState(nextGame, nextCtx)) persistActiveGame(nextGame, nextCtx);
      setIsThinking(false);
    }, thinkMs);
  };

  const checkGameEndState = (chess: Chess, ctx: GameContext): boolean => {
    if (chess.isCheckmate()) {
      const playerLost = chess.turn() === ctx.playerColor;
      setIsGameOver(true);
      if (playerLost) {
        setGameStatus('Scacco Matto! Ha vinto il computer.');
        setGameResult('loss');
        sound.playError();
        finalizeGame(chess, ctx, 'loss', 'Scacco matto subito');
      } else {
        setGameStatus('Scacco Matto! Hai vinto la partita! 🎉');
        setGameResult('win');
        sound.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        finalizeGame(chess, ctx, 'win', 'Scacco matto inflitto');
      }
      return true;
    }

    if (chess.isDraw()) {
      const reason = describeDraw(chess);
      setIsGameOver(true);
      setGameStatus(reason);
      setGameResult('draw');
      sound.playSuccess();
      finalizeGame(chess, ctx, 'draw', reason);
      return true;
    }

    return false;
  };

  const finalizeGame = (chess: Chess, ctx: GameContext, res: FinishedResult, reason: string) => {
    clearActiveGame();

    const savedRecord: SavedGame = {
      id: `game-${Date.now()}`,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      mode: ctx.mode,
      level: ctx.level,
      playerColor: ctx.playerColor,
      result: res,
      moves: ctx.moves,
      fens: ctx.fens,
      finalFen: chess.fen(),
      reason,
    };

    onUpdateProgress((prev) => {
      const isWin = res === 'win';
      const isDraw = res === 'draw';
      const newBadges = [...prev.unlockedBadges];
      if (isWin && !newBadges.includes('Prima Vittoria')) {
        newBadges.push('Prima Vittoria');
      }
      if (ctx.level >= 4 && isWin && !newBadges.includes('Maestro Tattico')) {
        newBadges.push('Maestro Tattico');
      }

      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (isWin ? 1 : 0),
        gamesDrawn: prev.gamesDrawn + (isDraw ? 1 : 0),
        gamesLost: prev.gamesLost + (res === 'loss' ? 1 : 0),
        totalTimeMinutes: prev.totalTimeMinutes + 10,
        unlockedBadges: newBadges,
        savedGames: [savedRecord, ...prev.savedGames.slice(0, MAX_SAVED_GAMES - 1)],
        lastActivity: {
          type: 'game',
          title: `Partita ${isWin ? 'Vinta' : isDraw ? 'Patta' : 'Persa'} (Livello ${ctx.level})`,
          timestamp: Date.now(),
        },
      };
    });
  };

  const startNewGame = (mode: GameMode = gameMode, level = difficultyLevel, color: Side = playerColor) => {
    cancelComputerTimer();
    const newChess = new Chess();
    const ctx: GameContext = { mode, level, playerColor: color, moves: [], fens: [newChess.fen()] };

    setGame(newChess);
    setGameMode(mode);
    setDifficultyLevel(level);
    setPlayerColor(color);
    setSelectedSquare(null);
    setLastMove(null);
    setGameStatus('Partita in corso');
    setIsGameOver(false);
    setGameResult(null);
    setSuggestedMove(null);
    setBlunderWarning(null);
    setMoveHistory(ctx.moves);
    setFenHistory(ctx.fens);
    applyAssistanceDefaults(mode);
    setInGame(true);
    clearActiveGame();

    // If player is Black, computer moves first
    if (color === 'b') executeComputerTurn(newChess, ctx, COMPUTER_OPENING_DELAY_MS - COMPUTER_THINK_MIN_MS);
  };

  // Resume an in-progress game saved by a previous session (mount only)
  useEffect(() => {
    const saved = loadActiveGame();
    if (!saved) return;
    const restored = restoreGame(saved);
    if (!restored || restored.isGameOver()) {
      clearActiveGame();
      return;
    }

    setGame(restored);
    setGameMode(saved.mode);
    setDifficultyLevel(saved.level);
    setPlayerColor(saved.playerColor);
    setMoveHistory(saved.moves);
    setFenHistory(saved.fens.length > 0 ? saved.fens : [restored.fen()]);
    applyAssistanceDefaults(saved.mode);
    setInGame(true);

    if (restored.turn() !== saved.playerColor) {
      executeComputerTurn(restored, {
        mode: saved.mode,
        level: saved.level,
        playerColor: saved.playerColor,
        moves: saved.moves,
        fens: saved.fens,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Validates a player move and either asks for confirmation (blunder) or plays it. */
  const attemptPlayerMove = (from: string, to: string) => {
    if (isGameOver || isThinking) return;
    if (game.turn() !== playerColor) return;
    const isLegal = game.moves({ square: from as Square, verbose: true }).some((m) => m.to === to);
    if (!isLegal) return;

    if (blunderPrevention && BLUNDER_GUARDED_MODES.includes(gameMode)) {
      const blunderCheck = analyzeMoveQuality(game, { from, to });
      if (blunderCheck.isBlunder && blunderCheck.warning) {
        setBlunderWarning({ pendingMove: { from, to }, message: blunderCheck.warning });
        return;
      }
    }

    executePlayerMove(from, to);
  };

  const handleSquareClick = (square: string) => {
    if (isGameOver || isThinking) return;
    if (game.turn() !== playerColor) return;

    const clickedPiece = game.get(square as Square);
    const ownsClicked = !!clickedPiece && clickedPiece.color === playerColor;

    if (!selectedSquare) {
      if (!ownsClicked) return;
      setSelectedSquare(square);
      setSuggestedMove(null);
      return;
    }

    if (square === selectedSquare) {
      setSelectedSquare(null);
      return;
    }

    const isLegalTarget = game
      .moves({ square: selectedSquare as Square, verbose: true })
      .some((m) => m.to === square);
    if (!isLegalTarget) {
      setSelectedSquare(ownsClicked ? square : null);
      return;
    }

    attemptPlayerMove(selectedSquare, square);
  };

  const executePlayerMove = (from: string, to: string) => {
    setBlunderWarning(null);
    const isCapture = !!game.get(to as Square);
    const working = cloneGame(game);
    const played = working.move({ from: from as Square, to: to as Square, promotion: 'q' });
    const ctx: GameContext = {
      ...currentContext(),
      moves: [...moveHistory, played.san],
      fens: [...fenHistory, working.fen()],
    };

    playMoveSounds(isCapture, working.isCheck());

    setGame(working);
    setLastMove({ from, to });
    setSelectedSquare(null);
    setSuggestedMove(null);
    setMoveHistory(ctx.moves);
    setFenHistory(ctx.fens);

    if (checkGameEndState(working, ctx)) return;
    persistActiveGame(working, ctx);
    executeComputerTurn(working, ctx);
  };

  const handleUndo = () => {
    if (isGameOver || isThinking || moveHistory.length === 0) return;

    // In a human vs engine game, undo 2 moves (computer's and player's)
    const undoCount = Math.min(game.turn() === playerColor ? 2 : 1, moveHistory.length);
    const working = cloneGame(game);
    for (let i = 0; i < undoCount; i++) working.undo();

    const ctx: GameContext = {
      ...currentContext(),
      moves: moveHistory.slice(0, moveHistory.length - undoCount),
      fens: fenHistory.slice(0, Math.max(1, fenHistory.length - undoCount)),
    };

    setGame(working);
    setSelectedSquare(null);
    setSuggestedMove(null);
    setTutorMessage(null);
    setBlunderWarning(null);
    setLastMove(null);
    setMoveHistory(ctx.moves);
    setFenHistory(ctx.fens);
    persistActiveGame(working, ctx);
    sound.playMove();
  };

  const handleResign = () => {
    if (isGameOver) return;
    cancelComputerTimer();
    setIsGameOver(true);
    setGameStatus('Hai abbandonato la partita.');
    setGameResult('loss');
    finalizeGame(game, currentContext(), 'loss', 'Abbandono');
  };

  const handleRequestHint = () => {
    if (isGameOver || isThinking || game.turn() !== playerColor) return;
    const hint = getTutorHint(game);
    if (!hint) return;
    setSuggestedMove({ from: hint.from, to: hint.to });
    setTutorMessage(hint.explanation);
    sound.playSuccess();
  };

  // Compute legal moves for the selected piece
  const legalMoveOptions: MoveOption[] =
    selectedSquare && showLegalMoves
      ? game.moves({ square: selectedSquare as Square, verbose: true }).map((m) => ({
          to: m.to,
          isCapture: !!m.captured,
          san: m.san,
        }))
      : [];

  // Threatened squares in assisted mode
  const threatenedSquares =
    highlightThreats && BLUNDER_GUARDED_MODES.includes(gameMode)
      ? getThreatenedSquares(game, playerColor)
      : [];

  const checkSquare = game.isCheck() ? findKingSquare(game, game.turn()) : null;
  const capturedPieces = getLostPieces(game) as { whiteLost: PieceType[]; blackLost: PieceType[] };
  const materialAdvantage = getMaterialDifference(game);

  if (!inGame) {
    return (
      <PlaySetup
        gameMode={gameMode}
        difficultyLevel={difficultyLevel}
        playerColor={playerColor}
        onDifficultyChange={setDifficultyLevel}
        onColorChange={setPlayerColor}
        onStart={startNewGame}
      />
    );
  }

  // Active Game Screen
  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Game Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInGame(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
          >
            ← Menu Partita
          </button>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              {getModeTitle(gameMode)}
            </span>
            <span className="text-xs text-slate-400 ml-2">
              (Computer Liv. {difficultyLevel})
            </span>
          </div>
        </div>

        {/* Turn indicator & Advantage */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400">Turno:</span>
            <span className={game.turn() === playerColor ? 'text-amber-300 font-bold' : 'text-slate-300'}>
              {game.turn() === playerColor ? 'Tuo turno' : 'Computer pensa...'}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-300 px-2 py-1 rounded-lg bg-slate-800">
            {materialAdvantage > 0 ? `+${materialAdvantage} Bianco` : materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)} Nero` : 'Parità'}
          </div>
        </div>
      </div>

      {/* Main Board & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: The Chessboard and Captured strips */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3">
          {/* Opponent Captured row */}
          <div className="w-full max-w-[520px] flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">
                {playerColor === 'w' ? 'Computer (Neri)' : 'Computer (Bianchi)'}
              </span>
              {isThinking && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> In calcolo...
                </span>
              )}
            </div>
            {/* Captured by player */}
            <div className="flex items-center gap-0.5 h-6">
              {(playerColor === 'w' ? capturedPieces.blackLost : capturedPieces.whiteLost).map(
                (pType, idx) => (
                  <div key={idx} className="w-5 h-5 opacity-90">
                    <ChessPiece type={pType} color={playerColor === 'w' ? 'b' : 'w'} pieceTheme={progress.profile?.pieceTheme} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Interactive Chessboard */}
          <Chessboard
            game={game}
            orientation={playerColor}
            selectedSquare={selectedSquare}
            legalMoves={legalMoveOptions}
            lastMove={lastMove}
            checkSquare={checkSquare}
            threatenedSquares={threatenedSquares}
            suggestedMove={suggestedMove}
            boardTheme={progress.profile?.boardTheme}
            pieceTheme={progress.profile?.pieceTheme}
            showCoordinates={progress.profile?.showCoordinates ?? true}
            onSquareClick={handleSquareClick}
            onMove={attemptPlayerMove}
            interactive={!isGameOver && !isThinking}
          />

          {/* Player Captured row */}
          <div className="w-full max-w-[520px] flex items-center justify-between px-2 text-xs">
            <span className="font-bold text-amber-300">
              {progress.profile?.name || 'Tu'} ({playerColor === 'w' ? 'Bianchi ⚪' : 'Neri ⚫'})
            </span>
            {/* Captured by opponent */}
            <div className="flex items-center gap-0.5 h-6">
              {(playerColor === 'w' ? capturedPieces.whiteLost : capturedPieces.blackLost).map(
                (pType, idx) => (
                  <div key={idx} className="w-5 h-5 opacity-90">
                    <ChessPiece type={pType} color={playerColor === 'w' ? 'w' : 'b'} pieceTheme={progress.profile?.pieceTheme} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Quick Actions Bar (Undo, Hint, Resign, New) directly reachable on smartphones */}
          <div className="w-full max-w-[520px] flex items-center gap-2 pt-1">
            <button
              onClick={handleUndo}
              disabled={isGameOver || isThinking || moveHistory.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Annulla</span>
            </button>
            {!isGameOver && (gameMode === 'assisted' || gameMode === 'didactic') && (
              <button
                onClick={handleRequestHint}
                disabled={isGameOver || isThinking || game.turn() !== playerColor}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 disabled:opacity-40 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer min-h-[44px]"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Aiuto</span>
              </button>
            )}
            <button
              onClick={handleResign}
              disabled={isGameOver}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition cursor-pointer min-h-[44px]"
              title="Abbandona"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abbandona</span>
            </button>
            <button
              onClick={() => startNewGame()}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer min-h-[44px]"
            >
              <span>Nuova</span>
            </button>
          </div>
        </div>

        {/* Right: Controls, Tutor and Moves List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Game Over Banner */}
          {isGameOver && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-400 space-y-3 shadow-2xl animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">{gameStatus}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Ottima sessione di gioco! Puoi rivedere ogni mossa con l'analisi o iniziare subito una nuova sfida.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => startNewGame()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer"
                >
                  Nuova Partita
                </button>
                <button
                  onClick={() => {
                    const record: SavedGame = {
                      id: `game-${Date.now()}`,
                      date: 'Adesso',
                      mode: gameMode,
                      level: difficultyLevel,
                      playerColor,
                      result: gameResult || 'draw',
                      moves: moveHistory,
                      fens: fenHistory,
                      finalFen: game.fen(),
                    };
                    onAnalyzeGame(record);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
                >
                  Analizza Partita
                </button>
              </div>
            </div>
          )}

          {/* Blunder Warning Dialog Modal */}
          {blunderWarning && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-100 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Avviso Mossa Rischiosa</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                {blunderWarning.message}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setBlunderWarning(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Ripensa la Mossa
                </button>
                <button
                  onClick={() =>
                    executePlayerMove(
                      blunderWarning.pendingMove.from,
                      blunderWarning.pendingMove.to
                    )
                  }
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Muovi Comunque
                </button>
              </div>
            </div>
          )}

          {/* Tutor & Advice Box */}
          {(gameMode === 'assisted' || gameMode === 'didactic') && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Assistente di Scacchi</span>
                </div>
                {!isGameOver && (
                  <button
                    onClick={handleRequestHint}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 transition cursor-pointer"
                  >
                    💡 Suggerisci Mossa
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {tutorMessage ||
                  (threatenedSquares.length > 0
                    ? 'Attenzione: alcuni tuoi pezzi sono minacciati (evidenziati con alone rosso). Valuta se difenderli o contrattaccare!'
                    : 'Posizione equilibrata. Sviluppa con calma e cerca di coordinare i pezzi.')}
              </p>

              {/* Assistance Settings Toggles */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-[11px]">
                <button
                  onClick={() => setShowLegalMoves(!showLegalMoves)}
                  className={`px-2 py-1 rounded-md border transition cursor-pointer ${
                    showLegalMoves
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Mosse legali: {showLegalMoves ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setHighlightThreats(!highlightThreats)}
                  className={`px-2 py-1 rounded-md border transition cursor-pointer ${
                    highlightThreats
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Pezzi minacciati: {highlightThreats ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setBlunderPrevention(!blunderPrevention)}
                  className={`px-2 py-1 rounded-md border transition cursor-pointer ${
                    blunderPrevention
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Avviso sviste: {blunderPrevention ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* Desktop-only secondary action bar */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={isGameOver || isThinking || moveHistory.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Annulla Mossa</span>
            </button>
            <button
              onClick={handleResign}
              disabled={isGameOver}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Abbandona</span>
            </button>
            <button
              onClick={() => startNewGame()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer"
            >
              <span>Nuova Partita</span>
            </button>
          </div>

          {/* Moves History Log */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Storico Mosse ({Math.ceil(moveHistory.length / 2)} turni)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
              {moveHistory.length === 0 ? (
                <div className="text-slate-500 italic">Nessuna mossa ancora giocata.</div>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                  const whiteMove = moveHistory[idx * 2];
                  const blackMove = moveHistory[idx * 2 + 1];
                  return (
                    <div key={idx} className="flex items-center py-0.5 border-b border-slate-800/40">
                      <span className="w-8 text-slate-500 font-bold">{idx + 1}.</span>
                      <span className="flex-1 text-slate-200">{whiteMove}</span>
                      <span className="flex-1 text-slate-400">{blackMove || ''}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
