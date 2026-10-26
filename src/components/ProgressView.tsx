import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle,
  Clock,
  Flame,
  Swords,
  Target,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { UserProgress } from '../utils/storage';
import { LEVELS } from '../data/lessons';
import { PUZZLES } from '../data/puzzles';

interface ProgressViewProps {
  progress: UserProgress;
  onResetProgress: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onResetProgress,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalLessons = LEVELS.flatMap((l) => l.lessons).length;
  const completedLessonsCount = progress.completedLessonIds.length;
  const coursePercent = Math.round((completedLessonsCount / totalLessons) * 100);

  const totalPuzzles = PUZZLES.length;
  const solvedPuzzlesCount = progress.completedPuzzleIds.length;

  const winRate =
    progress.gamesPlayed > 0
      ? Math.round((progress.gamesWon / progress.gamesPlayed) * 100)
      : 0;

  // Key skills assessment based on completed lessons
  const skills = [
    {
      title: 'Basi e Regole Generali',
      desc: 'Orientamento scacchiera, nomi dei pezzi e obiettivo della partita.',
      done: progress.completedLessonIds.includes('1-1') && progress.completedLessonIds.includes('1-2') && progress.completedLessonIds.includes('1-3'),
    },
    {
      title: 'Movimento di Tutti i Pezzi',
      desc: 'Padroneggia il cammino di pedone, torre, alfiere, cavallo, regina e re.',
      done: progress.completedLessonIds.includes('2-1') && progress.completedLessonIds.includes('2-2') && progress.completedLessonIds.includes('2-3'),
    },
    {
      title: 'Mosse Speciali: Arrocco e Promozione',
      desc: 'Capacità di proteggere il Re con l’arrocco e trasformare il pedone.',
      done: progress.completedLessonIds.includes('2-6'),
    },
    {
      title: 'Difesa del Re (Regola C-I-F)',
      desc: 'Reazione immediata allo scacco: Cattura, Interponi, Fuggi.',
      done: progress.completedLessonIds.includes('3-1'),
    },
    {
      title: 'Riconoscere Matto vs Stallo',
      desc: 'Evitare le patte per stallo quando si è in grande vantaggio.',
      done: progress.completedLessonIds.includes('3-2'),
    },
    {
      title: 'Presidio del Centro e Sviluppo',
      desc: 'Occupazione delle caselle centrali e valore indicativo dei pezzi.',
      done: progress.completedLessonIds.includes('4-1') && progress.completedLessonIds.includes('4-2'),
    },
    {
      title: 'Occhio Tattico: Forchette e Inchiodature',
      desc: 'Attacchi doppi col cavallo e blocco di pezzi vulnerabili.',
      done: progress.completedLessonIds.includes('5-1') || solvedPuzzlesCount >= 3,
    },
    {
      title: 'Chiusura di Partita nei Finali',
      desc: 'Tecnica di scacco matto con Donna e con Torre.',
      done: progress.completedLessonIds.includes('6-1') || progress.completedLessonIds.includes('6-2'),
    },
  ];

  const badges = [
    {
      title: 'Iniziato',
      desc: 'Primi passi nell’accademia',
      unlocked: true,
      icon: '🌱',
    },
    {
      title: 'Tattico in Erba',
      desc: 'Completato il livello sui movimenti dei pezzi',
      unlocked: progress.unlockedBadges.includes('Tattico in Erba') || progress.currentLevel >= 2,
      icon: '⚔️',
    },
    {
      title: 'Giocatore Consapevole',
      desc: 'Padroneggia la regola aurea C-I-F e lo scacco',
      unlocked: progress.unlockedBadges.includes('Giocatore Consapevole') || progress.currentLevel >= 3,
      icon: '🛡️',
    },
    {
      title: 'Stratega in Crescita',
      desc: 'Applica i principi del centro e dello sviluppo',
      unlocked: progress.unlockedBadges.includes('Stratega in Crescita') || progress.currentLevel >= 4,
      icon: '♟️',
    },
    {
      title: 'Prima Vittoria',
      desc: 'Hai sconfitto il computer in una partita',
      unlocked: progress.gamesWon > 0 || progress.unlockedBadges.includes('Prima Vittoria'),
      icon: '🏆',
    },
    {
      title: 'Risolutore di Enigmi',
      desc: 'Risolti almeno 5 problemi tattici',
      unlocked: solvedPuzzlesCount >= 5,
      icon: '🧩',
    },
    {
      title: 'Fedeltà Quotidiana',
      desc: 'Almeno 3 giorni consecutivi di attività',
      unlocked: progress.streakDays >= 3,
      icon: '🔥',
    },
    {
      title: 'Gran Maestro di Casa',
      desc: 'Hai completato tutti i livelli didattici',
      unlocked: completedLessonsCount >= totalLessons,
      icon: '👑',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>I Tuoi Traguardi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">
          Progressi e Competenze Acquisite
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Nessuna pressione: ogni mossa, esercizio o partita è un tassello che consolida il tuo divertimento e la tua visione scacchistica.
        </p>
      </div>

      {/* Main Overall Progress Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Percorso Didattico Globale
            </div>
            <div className="text-2xl font-bold text-white mt-1 font-serif">
              Livello {progress.currentLevel} di 7
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {completedLessonsCount} lezioni su {totalLessons} completate
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
              {coursePercent}%
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${coursePercent}%` }}
          />
        </div>
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Tempo Totale</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {progress.totalTimeMinutes} <span className="text-xs text-slate-400 font-normal">minuti</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Target className="w-4 h-4 text-purple-400" />
            <span>Problemi Risolti</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {solvedPuzzlesCount} <span className="text-xs text-slate-400 font-normal">/ {totalPuzzles}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Partite Giocate</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {progress.gamesPlayed} <span className="text-xs text-slate-400 font-normal">({progress.gamesWon}V / {progress.gamesLost}S)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Serie Giorni</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {progress.streakDays} <span className="text-xs text-slate-400 font-normal">giorni</span>
          </div>
        </div>
      </div>

      {/* Skills Checklist Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white font-serif">
          Competenze Acquisite
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                skill.done
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  skill.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${skill.done ? 'text-white' : 'text-slate-400'}`}>
                  {skill.title}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{skill.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trophies & Badges Collection */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white font-serif">
          Trofei & Medaglie
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-center transition ${
                b.unlocked
                  ? 'bg-slate-900 border-amber-500/30 shadow-md'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-40 grayscale'
              }`}
            >
              <div className="text-3xl mb-1">{b.icon}</div>
              <div className="text-xs font-bold text-white truncate">{b.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{b.desc}</div>
              {b.unlocked && (
                <span className="inline-block mt-2 text-[9px] uppercase tracking-wider font-extrabold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10">
                  Sbloccato
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reset Progress Action */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Vuoi ricominciare il percorso da zero o azzerare le statistiche?</span>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Azzera Dati</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold">Sei sicuro?</span>
            <button
              onClick={() => {
                onResetProgress();
                setShowResetConfirm(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
            >
              Sì, azzera
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
            >
              Annulla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
