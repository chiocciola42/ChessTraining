import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Play,
  TrendingUp,
} from 'lucide-react';
import { Chessboard } from './Chessboard';
import { SavedGame, UserProgress } from '../utils/storage';
import { Chess } from 'chess.js';
import { evaluateBoard, PIECE_VALUES, ITALIAN_PIECE_NAMES } from '../utils/chessEngine';
import { sound } from '../utils/sound';

interface AnalyzeViewProps {
  progress: UserProgress;
  activeGameRecord?: SavedGame | null;
  onPlayFromPosition: (fen: string) => void;
}

// Sample instructive game for adult beginners if no games played yet
const SAMPLE_INSTRUCTIVE_GAME: SavedGame = {
  id: 'sample-didactic-1',
  date: 'Partita Didattica Esempio',
  mode: 'assisted',
  level: 2,
  playerColor: 'w',
  result: 'win',
  moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3', 'd6', 'Bg5', 'h6', 'Bh4', 'g5', 'Bg3', 'Bg4', 'c3', 'Qd7', 'Nbd2', 'O-O-O'],
  fens: [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4',
  ],
  finalFen: '2kr3r/pppq1p2/2np1n1p/2b1p1p1/2B1P1b1/2PP1NBP/PP1N1PP1/R2Q1RK1 w - - 0 11',
  reason: 'Vittoria didattica',
};

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  progress,
  activeGameRecord,
  onPlayFromPosition,
}) => {
  const gamesList = progress.savedGames.length > 0 ? progress.savedGames : [SAMPLE_INSTRUCTIVE_GAME];
  const [selectedGameId, setSelectedGameId] = useState<string>(
    activeGameRecord?.id || gamesList[0].id
  );
  const [moveIndex, setMoveIndex] = useState<number>(0);

  const currentGame = gamesList.find((g) => g.id === selectedGameId) || gamesList[0];

  // Re-sync if activeGameRecord changes
  useEffect(() => {
    if (activeGameRecord) {
      setSelectedGameId(activeGameRecord.id);
      setMoveIndex(activeGameRecord.moves.length);
    }
  }, [activeGameRecord]);

  // Compute position FEN at current move index
  const currentFen = (() => {
    if (currentGame.fens && currentGame.fens[moveIndex]) {
      return currentGame.fens[moveIndex];
    }
    // Replay moves using chess.js
    const replay = new Chess();
    for (let i = 0; i < moveIndex && i < currentGame.moves.length; i++) {
      try {
        replay.move(currentGame.moves[i]);
      } catch {
        break;
      }
    }
    return replay.fen();
  })();

  // Current move string
  const currentMoveSan = moveIndex > 0 ? currentGame.moves[moveIndex - 1] : null;

  // Evaluation score in centipawns
  const score = (() => {
    try {
      const g = new Chess(currentFen);
      return evaluateBoard(g);
    } catch {
      return 0;
    }
  })();

  // Move Quality Classification & Italian Didactic Comments
  const moveFeedback = (() => {
    if (moveIndex === 0) {
      return {
        badge: 'Inizio Partita',
        color: 'text-slate-300 bg-slate-800',
        text: 'Posizione di partenza: entrambi i giocatori hanno tutte le 16 pedine schierate.',
      };
    }

    const isWhiteTurnJustPlayed = moveIndex % 2 !== 0;
    const san = currentMoveSan || '';

    // Checkmate
    if (san.includes('#')) {
      return {
        badge: 'Scacco Matto!',
        color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50',
        text: 'Mossa trionfale che chiude la partita in bellezza!',
      };
    }

    // Castling
    if (san.includes('O-O')) {
      return {
        badge: 'Ottima Mossa',
        color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50',
        text: "Arrocco tempestivo: protegge il Re dietro ai pedoni e centralizza la Torre.",
      };
    }

    // Center pawns (e4, d4, e5, d5)
    if (['e4', 'd4', 'e5', 'd5'].includes(san)) {
      return {
        badge: 'Principio Classico',
        color: 'text-amber-300 bg-amber-500/20 border-amber-500/50',
        text: 'Presidio solido delle caselle centrali. Questa spinta apre la strada agli Alfieri.',
      };
    }

    // Knight development
    if (san.startsWith('N') && (san.includes('f3') || san.includes('c3') || san.includes('f6') || san.includes('c6'))) {
      return {
        badge: 'Ottimo Sviluppo',
        color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50',
        text: 'Il Cavallo viene sviluppato verso il centro, dove controlla fino a 8 caselle.',
      };
    }

    // Captures
    if (san.includes('x')) {
      return {
        badge: 'Cattura Tattica',
        color: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/50',
        text: 'Cattura eseguita: elimina una risorsa avversaria dal campo.',
      };
    }

    // Evaluation jump check
    if (Math.abs(score) > 400) {
      return {
        badge: score > 0 ? 'Vantaggio Bianco' : 'Vantaggio Nero',
        color: 'text-purple-300 bg-purple-500/20 border-purple-500/50',
        text: 'Posizione sbilanciata: un giocatore ha guadagnato pezzi importanti.',
      };
    }

    return {
      badge: 'Mossa Ragionata',
      color: 'text-slate-300 bg-slate-800 border-slate-700',
      text: 'Mossa posizionale che prosegue il piano di gioco.',
    };
  })();

  const handleStep = (newIdx: number) => {
    const clamped = Math.max(0, Math.min(newIdx, currentGame.moves.length));
    setMoveIndex(clamped);
    sound.playMove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Search className="w-3.5 h-3.5" />
          <span>Revisione & Spiegazione Mosse</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">
          Analisi delle Partite
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Rivedere le proprie partite è il segreto numero uno per progredire senza fatica: capisci cosa ha funzionato e cosa puoi migliorare.
        </p>
      </div>

      {/* Game Selector Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {gamesList.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setSelectedGameId(g.id);
              setMoveIndex(0);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold shrink-0 border transition cursor-pointer ${
              selectedGameId === g.id
                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-bold">{g.date}</div>
            <div className="text-[10px] text-slate-400">
              {g.result === 'win' ? 'Vinta 🏆' : g.result === 'loss' ? 'Persa' : 'Patta'} • Liv. {g.level}
            </div>
          </button>
        ))}
      </div>

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          <Chessboard
            fen={currentFen}
            orientation={currentGame.playerColor}
            showCoordinates={true}
            interactive={false}
          />

          {/* Navigation Controls */}
          <div className="w-full max-w-[520px] flex items-center justify-between gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => handleStep(0)}
              disabled={moveIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 disabled:opacity-40 text-slate-300 cursor-pointer min-h-[44px] min-w-[40px] flex items-center justify-center font-bold"
              title="Inizio partita"
            >
              ⇤
            </button>
            <button
              onClick={() => handleStep(moveIndex - 1)}
              disabled={moveIndex === 0}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Indietro</span>
            </button>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 shrink-0">
              {moveIndex} / {currentGame.moves.length}
            </span>
            <button
              onClick={() => handleStep(moveIndex + 1)}
              disabled={moveIndex >= currentGame.moves.length}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer min-h-[44px]"
            >
              <span>Avanti</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStep(currentGame.moves.length)}
              disabled={moveIndex >= currentGame.moves.length}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 disabled:opacity-40 text-slate-300 cursor-pointer min-h-[44px] min-w-[40px] flex items-center justify-center font-bold"
              title="Fine partita"
            >
              ⇥
            </button>
          </div>
        </div>

        {/* Right: Evaluation & Explanations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Advantage Meter */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Termometro del Vantaggio</span>
              <span className="text-white font-mono">
                {score > 0 ? `+${(score / 100).toFixed(1)} Bianco` : score < 0 ? `+${Math.abs(score / 100).toFixed(1)} Nero` : 'Equilibrio'}
              </span>
            </div>
            {/* Split advantage bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-700">
              <div
                className="bg-white transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, 50 + score / 20))}%`,
                }}
              />
              <div
                className="bg-slate-800 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, 50 - score / 20))}%`,
                }}
              />
            </div>
          </div>

          {/* Move Analysis Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mossa analizzata:
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${moveFeedback.color}`}>
                {moveFeedback.badge}
              </span>
            </div>

            <div className="text-xl font-bold text-white font-mono">
              {currentMoveSan ? (
                <>
                  <span className="text-slate-500 font-sans text-sm mr-2">
                    Turno {Math.ceil(moveIndex / 2)}:
                  </span>
                  <span>{currentMoveSan}</span>
                </>
              ) : (
                'Posizione Iniziale'
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {moveFeedback.text}
            </p>
          </div>

          {/* Practice from here CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 space-y-2">
            <div className="text-xs font-bold text-cyan-300">Vuoi fare una prova?</div>
            <p className="text-xs text-slate-400">
              Rigioca da questo esatto punto della scacchiera contro il computer per testare mosse alternative!
            </p>
            <button
              onClick={() => onPlayFromPosition(currentFen)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Rigioca da Questa Posizione</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
