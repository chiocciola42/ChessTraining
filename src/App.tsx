import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Target,
  Swords,
  Search,
  BarChart3,
  Volume2,
  VolumeX,
  Home,
  Sparkles,
  Award,
} from 'lucide-react';
import { HomeView } from './components/HomeView';
import { LearnView } from './components/LearnView';
import { TrainView } from './components/TrainView';
import { PlayView } from './components/PlayView';
import { AnalyzeView } from './components/AnalyzeView';
import { ProgressView } from './components/ProgressView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  UserProgress,
  SavedGame,
  loadUserProgress,
  saveUserProgress,
} from './utils/storage';
import { sound } from './utils/sound';

export type NavTab = 'home' | 'learn' | 'train' | 'play' | 'analyze' | 'progress';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [progress, setProgress] = useState<UserProgress>(loadUserProgress);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [analyzedGame, setAnalyzedGame] = useState<SavedGame | null>(null);

  // Sync progress to LocalStorage
  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  };

  // Sound toggle
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.setEnabled(nextVal);
    if (nextVal) sound.playMove();
  };

  // Timer: increment active minutes spent learning/playing
  useEffect(() => {
    const timer = setInterval(() => {
      handleUpdateProgress((prev) => ({
        ...prev,
        totalTimeMinutes: prev.totalTimeMinutes + 1,
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handlers for cross-section navigation
  const handleStartLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('learn');
  };

  const handleQuickPlay = () => {
    setActiveTab('play');
  };

  const handleAnalyzeGame = (game: SavedGame) => {
    setAnalyzedGame(game);
    setActiveTab('analyze');
  };

  const handlePlayFromPosition = (fen: string) => {
    setActiveTab('play');
  };

  const handleResetProgress = () => {
    localStorage.clear();
    const fresh: UserProgress = {
      currentLevel: 1,
      completedLessonIds: [],
      completedPuzzleIds: [],
      gamesPlayed: 0,
      gamesWon: 0,
      gamesDrawn: 0,
      gamesLost: 0,
      totalTimeMinutes: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      lastActivity: {
        type: 'lesson',
        title: 'Benvenuto all’Accademia',
        timestamp: Date.now(),
      },
      savedGames: [],
      unlockedBadges: ['Iniziato'],
    };
    setProgress(fresh);
    saveUserProgress(fresh);
    sound.playMove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-6 py-2.5 sm:py-3 transition-colors pt-safe">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform p-1">
              <img src="/icon.svg" alt="Chess Academy" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm sm:text-lg font-extrabold tracking-tight text-white font-serif flex items-center gap-1.5 leading-tight">
                <span>Chess Academy</span>
                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                  IT
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Impara a giocare a scacchi • Senza stress
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'home', label: 'Inizio', icon: Home },
              { id: 'learn', label: 'Impara', icon: BookOpen },
              { id: 'train', label: 'Allenati', icon: Target },
              { id: 'play', label: 'Gioca', icon: Swords },
              { id: 'analyze', label: 'Analizza', icon: Search },
              { id: 'progress', label: 'Progressi', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Utility Controls & PWA Install Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition cursor-pointer"
              title={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* PWA In-App Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Application Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 pb-28 md:pb-12">
        {activeTab === 'home' && (
          <HomeView
            progress={progress}
            onNavigate={(tab) => setActiveTab(tab)}
            onStartLesson={handleStartLesson}
            onQuickPlay={handleQuickPlay}
          />
        )}

        {activeTab === 'learn' && (
          <LearnView
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            initialLessonId={selectedLessonId}
          />
        )}

        {activeTab === 'train' && (
          <TrainView
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {activeTab === 'play' && (
          <PlayView
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onAnalyzeGame={handleAnalyzeGame}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeView
            progress={progress}
            activeGameRecord={analyzedGame}
            onPlayFromPosition={handlePlayFromPosition}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            progress={progress}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar with Safe Area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-2 pt-2 pb-safe flex items-center justify-around shadow-2xl">
        {[
          { id: 'home', label: 'Inizio', icon: Home },
          { id: 'learn', label: 'Impara', icon: BookOpen },
          { id: 'train', label: 'Allenati', icon: Target },
          { id: 'play', label: 'Gioca', icon: Swords },
          { id: 'analyze', label: 'Analizza', icon: Search },
          { id: 'progress', label: 'Progressi', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1 px-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
