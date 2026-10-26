import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Chessboard, MoveOption } from './Chessboard';
import { LEVELS, Lesson, Level, LessonStep } from '../data/lessons';
import { UserProgress } from '../utils/storage';
import { sound } from '../utils/sound';
import { Chess } from 'chess.js';

interface LearnViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  initialLessonId?: string | null;
}

export const LearnView: React.FC<LearnViewProps> = ({
  progress,
  onUpdateProgress,
  initialLessonId,
}) => {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId || null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [currentFen, setCurrentFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [showHint, setShowHint] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  // Sync initial lesson id if passed
  useEffect(() => {
    if (initialLessonId) {
      setActiveLessonId(initialLessonId);
      setCurrentStepIdx(0);
      setStepCompleted(false);
      setFeedback({ type: null, message: '' });
      setShowHint(false);
    }
  }, [initialLessonId]);

  // Find active lesson object
  const activeLesson = LEVELS.flatMap((l) => l.lessons).find((l) => l.id === activeLessonId);
  const currentStep: LessonStep | undefined = activeLesson?.steps[currentStepIdx];

  // Initialize board state whenever step changes
  useEffect(() => {
    if (currentStep) {
      setCurrentFen(currentStep.interactiveFen);
      setSelectedSquare(null);
      setFeedback({ type: null, message: '' });
      setShowHint(false);
      setStepCompleted(false);
    }
  }, [currentStep]);

  // Compute legal moves on interactive step if a piece is selected
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
    // FEN might be an incomplete test board (e.g. only 1 king), ignore errors
  }

  const handleSquareClick = (square: string) => {
    if (stepCompleted || !currentStep) return;

    // Case A: The step expects the user to click or identify a specific square (e.g. h1, e4, d1)
    if (currentStep.expectedSquare) {
      if (square === currentStep.expectedSquare) {
        sound.playSuccess();
        setFeedback({
          type: 'success',
          message: currentStep.successFeedback,
        });
        setStepCompleted(true);
      } else {
        sound.playError();
        setFeedback({
          type: 'error',
          message: `Hai toccato ${square}. Riprova oppure tocca "Aiuto" per vedere dove si trova!`,
        });
      }
      return;
    }

    // Case B: The step expects a move from square A to square B
    if (currentStep.expectedMove) {
      if (!selectedSquare) {
        // Try selecting
        setSelectedSquare(square);
      } else {
        // We have selectedSquare and clicked another square
        if (square === selectedSquare) {
          // Deselect
          setSelectedSquare(null);
          return;
        }

        // Check if matching expected move
        if (
          selectedSquare === currentStep.expectedMove.from &&
          square === currentStep.expectedMove.to
        ) {
          // Play move on board
          try {
            const game = new Chess(currentFen);
            const isCapture = !!game.get(square as any);
            game.move({ from: selectedSquare as any, to: square as any, promotion: 'q' });
            setCurrentFen(game.fen());
            if (isCapture) sound.playCapture();
            else sound.playMove();
          } catch {
            // Manual fallback for custom position
            setCurrentFen(currentStep.demonstrationFen);
            sound.playMove();
          }

          sound.playSuccess();
          setSelectedSquare(null);
          setFeedback({
            type: 'success',
            message: currentStep.successFeedback,
          });
          setStepCompleted(true);
        } else {
          sound.playError();
          setFeedback({
            type: 'error',
            message: `Mossa diversa da quella richiesta. Tocca "${currentStep.expectedMove.from}" e poi "${currentStep.expectedMove.to}".`,
          });
          setSelectedSquare(null);
        }
      }
    }
  };

  const handleNextStep = () => {
    if (!activeLesson) return;

    if (currentStepIdx < activeLesson.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Completed entire lesson!
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      sound.playVictory();

      // Update progress
      onUpdateProgress((prev) => {
        const completed = prev.completedLessonIds.includes(activeLesson.id)
          ? prev.completedLessonIds
          : [...prev.completedLessonIds, activeLesson.id];

        // Unlock next level if all lessons in current level completed
        const currentLvl = LEVELS.find((l) => l.id === activeLesson.levelId);
        const allCompletedInLevel = currentLvl?.lessons.every((les) =>
          completed.includes(les.id)
        );
        const newLevel = allCompletedInLevel && activeLesson.levelId < 7
          ? Math.max(prev.currentLevel, activeLesson.levelId + 1)
          : prev.currentLevel;

        const newBadges = [...prev.unlockedBadges];
        if (allCompletedInLevel && currentLvl?.badge && !newBadges.includes(currentLvl.badge)) {
          newBadges.push(currentLvl.badge);
        }

        return {
          ...prev,
          completedLessonIds: completed,
          currentLevel: newLevel,
          unlockedBadges: newBadges,
          totalTimeMinutes: prev.totalTimeMinutes + (activeLesson.estimatedMinutes || 4),
          lastActivity: {
            type: 'lesson',
            title: `Completata: ${activeLesson.title}`,
            timestamp: Date.now(),
          },
        };
      });

      // Return to curriculum list
      setActiveLessonId(null);
    }
  };

  const handleResetStep = () => {
    if (currentStep) {
      setCurrentFen(currentStep.interactiveFen);
      setSelectedSquare(null);
      setFeedback({ type: null, message: '' });
      setStepCompleted(false);
    }
  };

  // If viewing active lesson exercise screen
  if (activeLesson && currentStep) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            onClick={() => setActiveLessonId(null)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Torna all'elenco lezioni</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-semibold">
              Passo {currentStepIdx + 1} di {activeLesson.steps.length}
            </span>
          </div>
        </div>

        {/* Lesson Interactive Area - Optimized for Mobile First */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 items-start">
          {/* Top Title & Task on Mobile */}
          <div className="w-full lg:col-span-6 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Livello {activeLesson.levelId} • {activeLesson.title}
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mt-0.5 font-serif">
                {currentStep.title}
              </h2>
            </div>

            {/* Practical Task Card - Front & Center */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 space-y-1.5 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cosa fare:</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                {currentStep.instruction}
              </p>
            </div>

            {/* Board on Mobile is placed right here */}
            <div className="lg:hidden w-full flex flex-col items-center">
              <Chessboard
                fen={currentFen}
                selectedSquare={selectedSquare}
                legalMoves={legalMoveOptions}
                highlightSquares={currentStep.highlights}
                boardTheme={progress.profile?.boardTheme}
                pieceTheme={progress.profile?.pieceTheme}
                showCoordinates={progress.profile?.showCoordinates ?? true}
                onSquareClick={handleSquareClick}
                onMove={(from, to) => {
                  if (stepCompleted) return;
                  setSelectedSquare(from);
                  handleSquareClick(from);
                  handleSquareClick(to);
                }}
                interactive={!stepCompleted}
              />
              <div className="mt-2 text-[11px] text-slate-400 text-center">
                {currentStep.expectedSquare
                  ? 'Tocca la casella indicata sulla scacchiera'
                  : 'Trascina o tocca il pezzo e poi la casella bersaglio'}
              </div>
            </div>

            {/* Feedback Alerts */}
            {feedback.type === 'success' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm font-medium flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-emerald-300">Ottimo lavoro!</div>
                  <div className="text-xs sm:text-sm mt-0.5">{feedback.message}</div>
                </div>
              </div>
            )}

            {feedback.type === 'error' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>{feedback.message}</div>
              </div>
            )}

            {/* Hint Box */}
            {showHint && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/90 border border-amber-400/30 text-amber-200 text-xs sm:text-sm">
                <span className="font-bold">Suggerimento: </span> {currentStep.hint}
              </div>
            )}

            {/* Actions Bar (Aiuto, Ricomincia, Prossimo Passo) */}
            <div className="flex items-center gap-2.5 pt-1">
              {!stepCompleted ? (
                <>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer min-h-[44px]"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>{showHint ? 'Nascondi' : 'Chiedi Aiuto'}</span>
                  </button>
                  <button
                    onClick={handleResetStep}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer min-h-[44px]"
                    title="Ricomincia Passo"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Ricomincia</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 active:scale-98 text-slate-950 font-bold text-sm sm:text-base shadow-lg hover:from-emerald-400 hover:to-emerald-500 transition cursor-pointer min-h-[48px]"
                >
                  <span>
                    {currentStepIdx < activeLesson.steps.length - 1
                      ? 'Prossimo Passo'
                      : 'Completa Lezione!'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Detailed Explanation Box */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Concetto Didattico:
              </span>
              <p>{currentStep.explanation}</p>
            </div>
          </div>

          {/* Desktop Board (hidden on mobile, shown on lg screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center">
            <Chessboard
              fen={currentFen}
              selectedSquare={selectedSquare}
              legalMoves={legalMoveOptions}
              highlightSquares={currentStep.highlights}
              boardTheme={progress.profile?.boardTheme}
              pieceTheme={progress.profile?.pieceTheme}
              showCoordinates={progress.profile?.showCoordinates ?? true}
              onSquareClick={handleSquareClick}
              onMove={(from, to) => {
                if (stepCompleted) return;
                setSelectedSquare(from);
                handleSquareClick(from);
                handleSquareClick(to);
              }}
              interactive={!stepCompleted}
            />
            <div className="mt-3 text-xs text-slate-400 text-center">
              {currentStep.expectedSquare
                ? 'Tocca la casella indicata sulla scacchiera'
                : 'Trascina il pezzo o tocca la casella di partenza e quella di arrivo'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Curriculum Browsing View (All 7 Levels)
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Percorso Didattico Strutturato</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">
          Impara a Giocare a Scacchi
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Sette livelli graduati pensati per un adulto che parte da zero: nessuna nozione teorica pesante, solo concetti chiari ed esercizi pratici per ogni regola.
        </p>
      </div>

      {/* Levels Accordion / Cards */}
      <div className="space-y-6">
        {LEVELS.map((level) => {
          const isUnlocked = level.id <= progress.currentLevel;
          const levelCompletedLessons = level.lessons.filter((l) =>
            progress.completedLessonIds.includes(l.id)
          ).length;
          const isLevelFinished = levelCompletedLessons === level.lessons.length;

          return (
            <div
              key={level.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                isUnlocked
                  ? 'bg-slate-900/80 border-slate-700/80 shadow-xl'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-75'
              }`}
            >
              {/* Level Header Banner */}
              <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      LIVELLO {level.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Badge: {level.badge}
                    </span>
                    {isLevelFinished && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completato</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                    {level.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {level.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Completamento</div>
                    <div className="text-sm font-bold text-white">
                      {levelCompletedLessons} / {level.lessons.length} lezioni
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {level.lessons.map((lesson) => {
                  const isLessonDone = progress.completedLessonIds.includes(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        setCurrentStepIdx(0);
                      }}
                      className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                        isLessonDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 hover:bg-slate-850'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isLessonDone
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/10 text-amber-400 group-hover:scale-105'
                        }`}
                      >
                        {isLessonDone ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <BookOpen className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {lesson.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {lesson.estimatedMinutes}m
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {lesson.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
