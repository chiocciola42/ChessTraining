import React from 'react';
import {
  BookOpen,
  Swords,
  Target,
  BarChart3,
  Clock,
  Flame,
  Award,
  ChevronRight,
  Sparkles,
  Search,
  Play,
} from 'lucide-react';
import { UserProgress } from '../utils/storage';
import { LEVELS } from '../data/lessons';

interface HomeViewProps {
  progress: UserProgress;
  onNavigate: (tab: 'home' | 'learn' | 'train' | 'play' | 'analyze' | 'progress') => void;
  onStartLesson: (lessonId: string) => void;
  onQuickPlay: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  onNavigate,
  onStartLesson,
  onQuickPlay,
}) => {
  // Determine next pending lesson
  const allLessons = LEVELS.flatMap((l) => l.lessons);
  const nextLesson = allLessons.find((l) => !progress.completedLessonIds.includes(l.id)) || allLessons[0];
  const currentLevelObj = LEVELS.find((l) => l.id === progress.currentLevel) || LEVELS[0];

  const totalLessons = allLessons.length;
  const completedCount = progress.completedLessonIds.length;
  const completionPercent = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-4 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scacchi per Adulti • Passo dopo Passo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-serif">
              Bentornato alla <span className="text-amber-400">Chess Academy</span>
            </h1>
          </div>

          {/* Quick Dual CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => onStartLesson(nextLesson.id)}
              className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm sm:text-base shadow-lg hover:from-amber-400 hover:to-amber-500 active:scale-98 transition cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-slate-950" />
              <span>Continua a Imparare</span>
              <ChevronRight className="w-4 h-4 ml-auto sm:ml-0" />
            </button>
            <button
              onClick={onQuickPlay}
              className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-semibold text-sm sm:text-base border border-slate-600/80 active:scale-98 transition cursor-pointer"
            >
              <Swords className="w-5 h-5 text-amber-400" />
              <span>Gioca una Partita</span>
            </button>
          </div>
        </div>

        {/* Level & Objective status strip */}
        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Livello Attuale</div>
            <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              <span>Livello {progress.currentLevel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-normal">
                {currentLevelObj.badge}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Prossimo Obiettivo</div>
            <div className="text-sm font-semibold text-amber-300 truncate mt-1">
              {nextLesson.title}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Circa {nextLesson.estimatedMinutes} minuti</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Ultima Attività</div>
            <div className="text-sm font-semibold text-slate-200 truncate mt-1">
              {progress.lastActivity?.title || 'Esplorazione iniziale'}
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{progress.totalTimeMinutes} min dedicati finora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Lezioni Concluse</div>
            <div className="text-lg font-bold text-white">
              {completedCount} <span className="text-xs text-slate-500 font-normal">/ {totalLessons}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Problemi Risolti</div>
            <div className="text-lg font-bold text-white">{progress.completedPuzzleIds.length}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Partite Disputate</div>
            <div className="text-lg font-bold text-white">{progress.gamesPlayed}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Giorni Consecutivi</div>
            <div className="text-lg font-bold text-white">{progress.streakDays} gg</div>
          </div>
        </div>
      </div>

      {/* 5 Architectural Sections Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">Tutte le Aree di Chess Academy</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Impara */}
          <div
            onClick={() => onNavigate('learn')}
            className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    1. Impara
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Percorso didattico in 7 livelli: regole, movimenti dei pezzi, strategie e finali spiegati in pillole pratiche.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span>Esplora i 7 Livelli</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Allenati */}
          <div
            onClick={() => onNavigate('train')}
            className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    2. Allenati
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Problemi interattivi e tattiche: matto in 1, forchette, inchiodature ed enigmi con spiegazione istantanea.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-purple-400">
                  <span>Risolvi il Problema del Giorno</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Gioca */}
          <div
            onClick={() => onNavigate('play')}
            className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    3. Gioca
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Sfida il computer a 6 livelli di difficoltà: Partita libera, assistita con tutor, didattica o veloce.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span>Avvia una Partita</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Analizza */}
          <div
            onClick={() => onNavigate('analyze')}
            className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    4. Analizza
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Rivedi mossa dopo mossa le partite disputate, comprendi gli errori commessi e scopri le mosse migliori.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <span>Esamina le tue Partite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Progressi */}
          <div
            onClick={() => onNavigate('progress')}
            className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-lg md:col-span-2"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    5. Progressi & Traguardi
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Monitora le competenze assimilate, la percentuale di padronanza dei concetti, i trofei sbloccati e le statistiche complessive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
