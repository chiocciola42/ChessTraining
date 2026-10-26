import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  ChevronLeft,
} from 'lucide-react';
import { Chessboard, MoveOption } from './Chessboard';
import { PUZZLES, Puzzle } from '../data/puzzles';
import { UserProgress } from '../utils/storage';
import { sound } from '../utils/sound';
import { Chess } from 'chess.js';

interface TrainViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

export const TrainView: React.FC<TrainViewProps> = ({ progress, onUpdateProgress }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);

  const [currentFen, setCurrentFen] = useState<string>('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [showHint, setShowHint] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  // Daily puzzle (based on day of year)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const dailyPuzzle = PUZZLES[dayOfYear % PUZZLES.length];

  const activePuzzle = PUZZLES.find((p) => p.id === activePuzzleId);

  // Initialize puzzle
  useEffect(() => {
    if (activePuzzle) {
      setCurrentFen(activePuzzle.fen);
      setSelectedSquare(null);
      setFeedback({ type: null, message: '' });
      setShowHint(false);
      setIsSolved(false);
    }
  }, [activePuzzle]);

  const filteredPuzzles = selectedCategory === 'all'
    ? PUZZLES
    : PUZZLES.filter((p) => p.category === selectedCategory);

  // Compute legal moves for selected piece
  let legalMoveOptions: MoveOption[] = [];
  try {
    if (currentFen && selectedSquare) {
      const tempGame = new Chess(currentFen);
      const moves = tempGame.moves({ square: selectedSquare as any, verbose: true });
      legalMoveOptions = moves.map((m) => ({
        to: m.to,
        isCapture: !!m.captured,
        san: m.san,
      }));
    }
  } catch {
    // Ignore invalid FEN test states
  }

  const handleSquareClick = (square: string) => {
    if (isSolved || !activePuzzle) return;

    if (!selectedSquare) {
      // Select source square
      setSelectedSquare(square);
    } else {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }

      // Check if this move matches expected move
      const isExpected =
        selectedSquare === activePuzzle.expectedMove.from &&
        square === activePuzzle.expectedMove.to;

      if (isExpected) {
        try {
          const game = new Chess(currentFen);
          const isCapture = !!game.get(square as any);
          game.move({ from: selectedSquare as any, to: square as any, promotion: 'q' });
          setCurrentFen(game.fen());
          if (isCapture) sound.playCapture();
          else sound.playMove();
        } catch {
          sound.playMove();
        }

        sound.playVictory();
        confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
        setIsSolved(true);
        setSelectedSquare(null);
        setFeedback({
          type: 'success',
          message: activePuzzle.explanation,
        });

        // Update progress
        onUpdateProgress((prev) => {
          const newCompleted = prev.completedPuzzleIds.includes(activePuzzle.id)
            ? prev.completedPuzzleIds
            : [...prev.completedPuzzleIds, activePuzzle.id];

          return {
            ...prev,
            completedPuzzleIds: newCompleted,
            totalTimeMinutes: prev.totalTimeMinutes + 2,
            lastActivity: {
              type: 'puzzle',
              title: `Risolto: ${activePuzzle.title}`,
              timestamp: Date.now(),
            },
          };
        });
      } else {
        sound.playError();
        setFeedback({
          type: 'error',
          message: 'Non è la mossa tattica corretta. Cerca una combinazione più efficace o chiedi un aiuto!',
        });
        setSelectedSquare(null);
      }
    }
  };

  const handleResetPuzzle = () => {
    if (activePuzzle) {
      setCurrentFen(activePuzzle.fen);
      setSelectedSquare(null);
      setFeedback({ type: null, message: '' });
      setIsSolved(false);
    }
  };

  const handleNextPuzzle = () => {
    const currentIndex = PUZZLES.findIndex((p) => p.id === activePuzzleId);
    const next = PUZZLES[(currentIndex + 1) % PUZZLES.length];
    setActivePuzzleId(next.id);
  };

  // Active puzzle player screen
  if (activePuzzle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            onClick={() => setActivePuzzleId(null)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Tutti i problemi</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
              {activePuzzle.categoryLabel}
            </span>
          </div>
        </div>

        {/* Puzzle Workspace - Optimized for Mobile & Touch */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 items-start">
          {/* Details & Help */}
          <div className="w-full lg:col-span-6 space-y-4">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Tocca a: {activePuzzle.playerTurn === 'w' ? 'Bianco ⚪' : 'Nero ⚫'}
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mt-0.5 font-serif">
                {activePuzzle.title}
              </h2>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-purple-400 uppercase">Obiettivo:</div>
              <p className="text-sm sm:text-base text-white font-medium leading-snug">
                {activePuzzle.instruction}
              </p>
            </div>

            {/* Chessboard for Mobile placed directly under objective */}
            <div className="lg:hidden w-full flex flex-col items-center">
              <Chessboard
                fen={currentFen}
                orientation={activePuzzle.playerTurn}
                selectedSquare={selectedSquare}
                legalMoves={legalMoveOptions}
                onSquareClick={handleSquareClick}
                onMove={(from, to) => {
                  if (isSolved) return;
                  setSelectedSquare(from);
                  handleSquareClick(from);
                  handleSquareClick(to);
                }}
                showCoordinates={true}
                interactive={!isSolved}
              />
            </div>

            {/* Feedback Alerts */}
            {feedback.type === 'success' && (
              <div className="p-3.5 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-base">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Problema Risolto!</span>
                </div>
                <p className="leading-relaxed text-xs sm:text-sm">{feedback.message}</p>
              </div>
            )}

            {feedback.type === 'error' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>{feedback.message}</div>
              </div>
            )}

            {/* Hint Box */}
            {showHint && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
                <span className="font-bold">Indizio: </span> {activePuzzle.hint}
              </div>
            )}

            {/* Controls (Hint, Reset, Next) */}
            <div className="flex items-center gap-2.5 pt-1">
              {!isSolved ? (
                <>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer min-h-[44px]"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>{showHint ? 'Nascondi' : 'Vedi Indizio'}</span>
                  </button>
                  <button
                    onClick={handleResetPuzzle}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer min-h-[44px]"
                    title="Ricomincia"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Ricomincia</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNextPuzzle}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg hover:from-purple-400 hover:to-purple-500 transition cursor-pointer min-h-[48px]"
                >
                  <span>Prossimo Problema</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Chessboard */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center">
            <Chessboard
              fen={currentFen}
              orientation={activePuzzle.playerTurn}
              selectedSquare={selectedSquare}
              legalMoves={legalMoveOptions}
              onSquareClick={handleSquareClick}
              onMove={(from, to) => {
                if (isSolved) return;
                setSelectedSquare(from);
                handleSquareClick(from);
                handleSquareClick(to);
              }}
              showCoordinates={true}
              interactive={!isSolved}
            />
          </div>
        </div>
      </div>
    );
  }

  // Puzzle Catalog & Daily Problem
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Target className="w-3.5 h-3.5" />
          <span>Palestra di Tattica & Enigmi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">
          Allenati coi Problemi Interattivi
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Riconoscere matti in una mossa, forchette di cavallo e pezzi indifesi allena l'occhio in pochi minuti.
        </p>
      </div>

      {/* Featured: Daily Puzzle */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/40 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>PROBLEMA DEL GIORNO</span>
            </div>
            <h3 className="text-xl font-bold text-white font-serif">{dailyPuzzle.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300">{dailyPuzzle.instruction}</p>
          </div>

          <button
            onClick={() => setActivePuzzleId(dailyPuzzle.id)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-sm shadow-md hover:from-purple-400 hover:to-purple-500 active:scale-98 transition cursor-pointer shrink-0"
          >
            <span>Risolvi Ora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Tutti i problemi' },
          { id: 'matto1', label: 'Matto in 1' },
          { id: 'forchetta', label: 'Forchetta' },
          { id: 'inchiodatura', label: 'Inchiodatura' },
          { id: 'salvataggio', label: 'Salva il Re' },
          { id: 'materiale', label: 'Tattica' },
          { id: 'finali', label: 'Finali' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Puzzles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPuzzles.map((puzzle) => {
          const isSolved = progress.completedPuzzleIds.includes(puzzle.id);

          return (
            <div
              key={puzzle.id}
              onClick={() => setActivePuzzleId(puzzle.id)}
              className={`group p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                isSolved
                  ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60'
                  : 'bg-slate-900 border-slate-800 hover:border-purple-500/50 hover:bg-slate-850'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isSolved
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-slate-800 text-slate-400 group-hover:text-purple-400'
                }`}
              >
                {isSolved ? (
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                ) : (
                  <Target className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                    {puzzle.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-500">
                    {'★'.repeat(puzzle.difficulty)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white truncate mt-0.5 group-hover:text-purple-300 transition-colors">
                  {puzzle.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {puzzle.instruction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
