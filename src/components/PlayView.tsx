import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  RotateCcw,
  Flag,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Sliders,
  Play,
  Award,
  Sparkles,
  ChevronRight,
  Eye,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Chessboard, MoveOption } from './Chessboard';
import { Chess, Square } from 'chess.js';
import {
  getComputerMove,
  getThreatenedSquares,
  getTutorHint,
  analyzeMoveQuality,
  PIECE_VALUES,
  ITALIAN_PIECE_NAMES,
} from '../utils/chessEngine';
import { sound } from '../utils/sound';
import { SavedGame, UserProgress } from '../utils/storage';
import { ChessPiece, PieceType } from './ChessPiece';

interface PlayViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onAnalyzeGame: (game: SavedGame) => void;
}

export const PlayView: React.FC<PlayViewProps> = ({
  progress,
  onUpdateProgress,
  onAnalyzeGame,
}) => {
  // Game setup states
  const [inGame, setInGame] = useState(false);
  const [gameMode, setGameMode] = useState<'free' | 'assisted' | 'didactic' | 'quick'>('assisted');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  // Active game chess instance
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Partita in corso');
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);

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

  // Auto-save key for in-progress games
  const ACTIVE_GAME_KEY = 'chess_academy_active_game_state';

  // Check if there is an in-progress game to resume
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_GAME_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fen && !parsed.isGameOver) {
          const loadedGame = new Chess(parsed.fen);
          setGame(loadedGame);
          setGameMode(parsed.mode || 'assisted');
          setDifficultyLevel(parsed.level || 2);
          setPlayerColor(parsed.playerColor || 'w');
          setMoveHistory(parsed.moves || []);
          setFenHistory(parsed.fens || [new Chess().fen()]);
          setInGame(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save active game to localStorage
  const persistActiveGame = (currentGame: Chess, finished = false) => {
    if (finished) {
      localStorage.removeItem(ACTIVE_GAME_KEY);
      return;
    }
    const state = {
      fen: currentGame.fen(),
      mode: gameMode,
      level: difficultyLevel,
      playerColor,
      moves: moveHistory,
      fens: fenHistory,
      isGameOver: false,
    };
    try {
      localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  };

  const startNewGame = (mode = gameMode, level = difficultyLevel, color = playerColor) => {
    const finalColor = color === 'b' ? 'b' : color === 'w' ? 'w' : Math.random() < 0.5 ? 'w' : 'b';
    const newChess = new Chess();
    setGame(newChess);
    setGameMode(mode);
    setDifficultyLevel(level);
    setPlayerColor(finalColor);
    setSelectedSquare(null);
    setLastMove(null);
    setGameStatus('Partita in corso');
    setIsGameOver(false);
    setGameResult(null);
    setSuggestedMove(null);
    setTutorMessage(null);
    setBlunderWarning(null);
    setMoveHistory([]);
    setFenHistory([newChess.fen()]);
    setInGame(true);

    if (mode === 'assisted') {
      setShowLegalMoves(true);
      setHighlightThreats(true);
      setBlunderPrevention(true);
    } else if (mode === 'didactic') {
      setShowLegalMoves(true);
      setHighlightThreats(true);
      setBlunderPrevention(true);
      setTutorMessage('Inizia sviluppando i pedoni centrali (e4 o d4) e porta in gioco Cavalli e Alfieri!');
    } else {
      setShowLegalMoves(false);
      setHighlightThreats(false);
      setBlunderPrevention(false);
    }

    // If player is Black, computer moves first
    if (finalColor === 'b') {
      setTimeout(() => {
        executeComputerTurn(newChess, level);
      }, 600);
    }
  };

  const executeComputerTurn = (currentChess: Chess, lvl: number) => {
    setIsThinking(true);
    setTimeout(() => {
      const compMove = getComputerMove(currentChess, lvl);
      if (compMove) {
        const isCapture = !!currentChess.get(compMove.to as Square);
        const played = currentChess.move({ from: compMove.from, to: compMove.to, promotion: 'q' });
        const newFen = currentChess.fen();

        if (isCapture) sound.playCapture();
        else sound.playMove();

        if (currentChess.isCheck()) sound.playCheck();

        setLastMove({ from: compMove.from, to: compMove.to });
        setGame(new Chess(newFen));
        setMoveHistory((prev) => [...prev, played.san]);
        setFenHistory((prev) => [...prev, newFen]);

        // Didactic commentary on computer's move
        if (gameMode === 'didactic') {
          if (isCapture) {
            setTutorMessage(`L'avversario ha catturato in ${compMove.to}. Osserva come risponde il tuo esercito!`);
          } else if (compMove.san.includes('O-O')) {
            setTutorMessage("L'avversario ha eseguito l'arrocco per mettere al sicuro il proprio Re.");
          } else {
            setTutorMessage(`Mossa avversaria: ${compMove.san}. Tocca a te riflettere con calma.`);
          }
        }

        checkGameEndState(currentChess);
      }
      setIsThinking(false);
    }, 400 + Math.random() * 300);
  };

  const checkGameEndState = (chessInstance: Chess) => {
    if (chessInstance.isCheckmate()) {
      setIsGameOver(true);
      const isPlayerTurn = chessInstance.turn() === playerColor;
      if (isPlayerTurn) {
        setGameStatus('Scacco Matto! Ha vinto il computer.');
        setGameResult('loss');
        sound.playError();
        finalizeGame(chessInstance, 'loss', 'Scacco matto subito');
      } else {
        setGameStatus('Scacco Matto! Hai vinto la partita! 🎉');
        setGameResult('win');
        sound.playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        finalizeGame(chessInstance, 'win', 'Scacco matto inflitto');
      }
      return true;
    }

    if (chessInstance.isDraw()) {
      setIsGameOver(true);
      let reason = 'Partita patta';
      if (chessInstance.isStalemate()) reason = 'Patta per Stallo';
      else if (chessInstance.isThreefoldRepetition()) reason = 'Patta per ripetizione di mosse';
      else if (chessInstance.isInsufficientMaterial()) reason = 'Patta per materiale insufficiente';

      setGameStatus(reason);
      setGameResult('draw');
      sound.playSuccess();
      finalizeGame(chessInstance, 'draw', reason);
      return true;
    }

    return false;
  };

  const finalizeGame = (finalChess: Chess, res: 'win' | 'loss' | 'draw', reason: string) => {
    persistActiveGame(finalChess, true);

    const savedRecord: SavedGame = {
      id: `game-${Date.now()}`,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      mode: gameMode,
      level: difficultyLevel,
      playerColor,
      result: res,
      moves: moveHistory,
      fens: fenHistory,
      finalFen: finalChess.fen(),
      reason,
    };

    onUpdateProgress((prev) => {
      const isWin = res === 'win';
      const isDraw = res === 'draw';
      const newBadges = [...prev.unlockedBadges];
      if (isWin && !newBadges.includes('Prima Vittoria')) {
        newBadges.push('Prima Vittoria');
      }
      if (difficultyLevel >= 4 && isWin && !newBadges.includes('Maestro Tattico')) {
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
        savedGames: [savedRecord, ...prev.savedGames.slice(0, 19)],
        lastActivity: {
          type: 'game',
          title: `Partita ${isWin ? 'Vinta' : isDraw ? 'Patta' : 'Persa'} (Livello ${difficultyLevel})`,
          timestamp: Date.now(),
        },
      };
    });
  };

  const handleSquareClick = (square: string) => {
    if (isGameOver || isThinking) return;
    if (game.turn() !== playerColor) return;

    if (!selectedSquare) {
      // Select square if it belongs to player
      const piece = game.get(square as Square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        setSuggestedMove(null);
      }
      return;
    }

    if (square === selectedSquare) {
      setSelectedSquare(null);
      return;
    }

    // Attempting move from selectedSquare to square
    const legalMoves = game.moves({ square: selectedSquare as Square, verbose: true });
    const targetMove = legalMoves.find((m) => m.to === square);

    if (!targetMove) {
      // If clicking another of player's own pieces, switch selection
      const otherPiece = game.get(square as Square);
      if (otherPiece && otherPiece.color === playerColor) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
      return;
    }

    // Assisted mode: check for blunder before executing
    if (blunderPrevention && (gameMode === 'assisted' || gameMode === 'didactic')) {
      const blunderCheck = analyzeMoveQuality(game, { from: selectedSquare, to: square });
      if (blunderCheck.isBlunder && blunderCheck.warning) {
        setBlunderWarning({
          pendingMove: { from: selectedSquare, to: square },
          message: blunderCheck.warning,
        });
        return;
      }
    }

    // Execute player move
    executePlayerMove(selectedSquare, square);
  };

  const executePlayerMove = (from: string, to: string) => {
    setBlunderWarning(null);
    const isCapture = !!game.get(to as Square);
    const played = game.move({ from: from as Square, to: to as Square, promotion: 'q' });
    const newFen = game.fen();

    if (isCapture) sound.playCapture();
    else sound.playMove();

    if (game.isCheck()) sound.playCheck();

    setLastMove({ from, to });
    setSelectedSquare(null);
    setSuggestedMove(null);

    const updatedMoves = [...moveHistory, played.san];
    const updatedFens = [...fenHistory, newFen];
    setMoveHistory(updatedMoves);
    setFenHistory(updatedFens);

    persistActiveGame(game);

    const ended = checkGameEndState(game);
    if (!ended) {
      executeComputerTurn(game, difficultyLevel);
    }
  };

  const handleUndo = () => {
    if (isGameOver || isThinking || moveHistory.length === 0) return;

    // In a human vs engine game, undo 2 moves (computer's and player's)
    const undoCount = game.turn() === playerColor ? 2 : 1;
    for (let i = 0; i < undoCount; i++) {
      if (game.history().length > 0) {
        game.undo();
      }
    }

    const newFen = game.fen();
    setGame(new Chess(newFen));
    setSelectedSquare(null);
    setSuggestedMove(null);
    setTutorMessage(null);
    setBlunderWarning(null);
    setMoveHistory((prev) => prev.slice(0, Math.max(0, prev.length - undoCount)));
    setFenHistory((prev) => prev.slice(0, Math.max(1, prev.length - undoCount)));
    persistActiveGame(game);
    sound.playMove();
  };

  const handleResign = () => {
    if (isGameOver) return;
    setIsGameOver(true);
    setGameStatus('Hai abbandonato la partita.');
    setGameResult('loss');
    finalizeGame(game, 'loss', 'Abbandono');
  };

  const handleRequestHint = () => {
    if (isGameOver || isThinking || game.turn() !== playerColor) return;
    const hint = getTutorHint(game);
    if (hint) {
      setSuggestedMove({ from: hint.from, to: hint.to });
      setTutorMessage(hint.explanation);
      sound.playSuccess();
    }
  };

  // Compute legal moves for the selected piece
  let legalMoveOptions: MoveOption[] = [];
  if (selectedSquare && showLegalMoves) {
    const moves = game.moves({ square: selectedSquare as Square, verbose: true });
    legalMoveOptions = moves.map((m) => ({
      to: m.to,
      isCapture: !!m.captured,
      san: m.san,
    }));
  }

  // Threatened squares in assisted mode
  const threatenedSquares = highlightThreats && (gameMode === 'assisted' || gameMode === 'didactic')
    ? getThreatenedSquares(game, playerColor)
    : [];

  // King check square
  const checkSquare = game.isCheck()
    ? (() => {
        const board = game.board();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === game.turn()) {
              return `${String.fromCharCode(97 + c)}${8 - r}`;
            }
          }
        }
        return null;
      })()
    : null;

  // Captured pieces calculation
  const capturedPieces = (() => {
    const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts: Record<string, number> = {
      wp: 0, wn: 0, wb: 0, wr: 0, wq: 0,
      bp: 0, bn: 0, bb: 0, br: 0, bq: 0,
    };

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type !== 'k') {
          currentCounts[`${p.color}${p.type}`]++;
        }
      }
    }

    const whiteLost: PieceType[] = [];
    const blackLost: PieceType[] = [];

    (['p', 'n', 'b', 'r', 'q'] as PieceType[]).forEach((t) => {
      const wDeficit = initialCounts[t] - currentCounts[`w${t}`];
      for (let i = 0; i < wDeficit; i++) whiteLost.push(t);
      const bDeficit = initialCounts[t] - currentCounts[`b${t}`];
      for (let i = 0; i < bDeficit; i++) blackLost.push(t);
    });

    return { whiteLost, blackLost };
  })();

  // Material evaluation difference
  const materialAdvantage = (() => {
    let wScore = 0;
    let bScore = 0;
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type !== 'k') {
          if (p.color === 'w') wScore += PIECE_VALUES[p.type] || 0;
          else bScore += PIECE_VALUES[p.type] || 0;
        }
      }
    }
    const diff = (wScore - bScore) / 100;
    return diff;
  })();

  // If NOT in active game, show Game Setup / Mode Selector Screen
  if (!inGame) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Swords className="w-3.5 h-3.5" />
            <span>Sfida il Computer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">
            Gioca una Partita
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Scegli tra quattro modalità create per il puro piacere di giocare, senza fretta né ansia da prestazione.
          </p>
        </div>

        {/* 4 Game Modes Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mode 1: Partita Assistita */}
          <div
            onClick={() => {
              setGameMode('assisted');
              startNewGame('assisted', difficultyLevel, playerColor);
            }}
            className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 p-6 cursor-pointer transition shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Consigliata per te
              </span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3 font-serif group-hover:text-emerald-300 transition-colors">
              Partita Assistita
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Hai al tuo fianco un maestro discreto: evidenzia le mosse legali, segnala i pezzi minacciati e ti avvisa prima di un errore grave.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span>Inizia Assistita</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 2: Partita Libera */}
          <div
            onClick={() => {
              setGameMode('free');
              startNewGame('free', difficultyLevel, playerColor);
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 cursor-pointer transition shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                Classica
              </span>
              <Swords className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3 font-serif group-hover:text-amber-300 transition-colors">
              Partita Libera
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Scacchi puri al 100%: nessun limite di tempo, possibilità di annullare qualsiasi mossa e salvataggio automatico.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-400">
              <span>Inizia Partita Libera</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 3: Partita Didattica */}
          <div
            onClick={() => {
              setGameMode('didactic');
              startNewGame('didactic', difficultyLevel, playerColor);
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-6 cursor-pointer transition shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 font-medium">
                Impara Giocando
              </span>
              <Lightbulb className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3 font-serif group-hover:text-purple-300 transition-colors">
              Partita Didattica
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Il computer commenta le posizioni chiave ("Attenzione al cavallo!", "Ottima spinta al centro") aiutandoti a capire la strategia.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-purple-400">
              <span>Inizia Didattica</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mode 4: Partita Veloce */}
          <div
            onClick={() => {
              setGameMode('quick');
              startNewGame('quick', 2, 'w');
            }}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 cursor-pointer transition shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-medium">
                Un Click
              </span>
              <Play className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3 font-serif group-hover:text-cyan-300 transition-colors">
              Partita Veloce
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Via subito! Avversario facile, nessun menu di configurazione, pronti a giocare in un solo secondo.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-cyan-400">
              <span>Avvia Veloce</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Custom Configuration Section */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Configurazione Partita Personalizzata</span>
          </div>

          {/* Difficulty Levels */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Livello Avversario Computer:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { lvl: 1, name: 'Assoluto', desc: 'Errori frequenti' },
                { lvl: 2, name: 'Principiante', desc: 'Semplice' },
                { lvl: 3, name: 'Facile', desc: 'Difesa base' },
                { lvl: 4, name: 'Intermedio', desc: 'Ragionato' },
                { lvl: 5, name: 'Avanzato', desc: 'Impegnativo' },
                { lvl: 6, name: 'Esperto', desc: 'Massima forza' },
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => setDifficultyLevel(item.lvl)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    difficultyLevel === item.lvl
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">Livello {item.lvl}</div>
                  <div className="text-xs font-semibold mt-0.5 text-amber-300">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece Color Choice */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scegli con che colore giocare:
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPlayerColor('w')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
                  playerColor === 'w'
                    ? 'bg-white text-slate-900 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <span>⚪ Bianchi (Muovi per primo)</span>
              </button>
              <button
                onClick={() => setPlayerColor('b')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
                  playerColor === 'b'
                    ? 'bg-slate-950 text-white border-amber-400 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <span>⚫ Neri (Rispondi al computer)</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => startNewGame()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-base shadow-xl hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Comincia Partita Ora</span>
          </button>
        </div>
      </div>
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
              {gameMode === 'assisted'
                ? 'Partita Assistita'
                : gameMode === 'didactic'
                ? 'Partita Didattica'
                : gameMode === 'quick'
                ? 'Partita Veloce'
                : 'Partita Libera'}
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
                    <ChessPiece type={pType} color={playerColor === 'w' ? 'b' : 'w'} />
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
            onSquareClick={handleSquareClick}
            onMove={(from, to) => {
              if (isGameOver || isThinking) return;
              if (game.turn() !== playerColor) return;
              const legal = game.moves({ square: from as Square, verbose: true });
              const target = legal.find((m) => m.to === to);
              if (!target) return;

              if (blunderPrevention && (gameMode === 'assisted' || gameMode === 'didactic')) {
                const blunderCheck = analyzeMoveQuality(game, { from, to });
                if (blunderCheck.isBlunder && blunderCheck.warning) {
                  setBlunderWarning({
                    pendingMove: { from, to },
                    message: blunderCheck.warning,
                  });
                  return;
                }
              }
              executePlayerMove(from, to);
            }}
            showCoordinates={true}
            interactive={!isGameOver && !isThinking}
          />

          {/* Player Captured row */}
          <div className="w-full max-w-[520px] flex items-center justify-between px-2 text-xs">
            <span className="font-bold text-amber-300">
              Tu ({playerColor === 'w' ? 'Bianchi ⚪' : 'Neri ⚫'})
            </span>
            {/* Captured by opponent */}
            <div className="flex items-center gap-0.5 h-6">
              {(playerColor === 'w' ? capturedPieces.whiteLost : capturedPieces.blackLost).map(
                (pType, idx) => (
                  <div key={idx} className="w-5 h-5 opacity-90">
                    <ChessPiece type={pType} color={playerColor === 'w' ? 'w' : 'b'} />
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
