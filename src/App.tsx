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
  User,
  Sun,
  Moon,
  Palette,
  Sparkles,
} from 'lucide-react';
import { HomeView } from './components/HomeView';
import { LearnView } from './components/LearnView';
import { TrainView } from './components/TrainView';
import { PlayView } from './components/PlayView';
import { AnalyzeView } from './components/AnalyzeView';
import { ProgressView } from './components/ProgressView';
import { ProfileView } from './components/ProfileView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  UserProgress,
  UserProfile,
  SavedGame,
  loadUserProgress,
  saveUserProgress,
} from './utils/storage';
import { sound } from './utils/sound';

export type NavTab = 'home' | 'learn' | 'train' | 'play' | 'analyze' | 'progress' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [progress, setProgress] = useState<UserProgress>(loadUserProgress);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(progress.profile?.soundEnabled ?? true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [analyzedGame, setAnalyzedGame] = useState<SavedGame | null>(null);

  const isDay = progress.profile?.themeMode === 'day';

  // Sync progress to LocalStorage
  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  };

  // Profile-specific updater
  const handleUpdateProfile = (updater: (prevProfile: UserProfile) => UserProfile) => {
    handleUpdateProgress((prev) => ({
      ...prev,
      profile: updater(prev.profile),
    }));
  };

  // Toggle Day / Night theme
  const toggleDayNight = () => {
    const nextMode = isDay ? 'night' : 'day';
    handleUpdateProfile((p) => ({ ...p, themeMode: nextMode }));
    sound.playMove();
  };

  // Sound toggle
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.setEnabled(nextVal);
    handleUpdateProfile((p) => ({ ...p, soundEnabled: nextVal }));
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

  const handlePlayFromPosition = (_fen: string) => {
    setActiveTab('play');
  };

  const handleResetProgress = () => {
    localStorage.clear();
    const fresh = loadUserProgress();
    setProgress(fresh);
    sound.playMove();
  };

  const navItems = [
    { id: 'home', label: 'Inizio', icon: Home },
    { id: 'learn', label: 'Impara', icon: BookOpen },
    { id: 'train', label: 'Allenati', icon: Target },
    { id: 'play', label: 'Gioca', icon: Swords },
    { id: 'analyze', label: 'Analizza', icon: Search },
    { id: 'progress', label: 'Progressi', icon: BarChart3 },
    { id: 'profile', label: 'Profilo', icon: User },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDay
          ? 'bg-stone-100 text-stone-900 selection:bg-amber-400 selection:text-stone-950'
          : 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950'
      }`}
    >
      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* Main Top Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 sm:px-6 py-2.5 sm:py-3 transition-colors pt-safe ${
          isDay
            ? 'bg-white/90 border-stone-200/90 text-stone-900'
            : 'bg-slate-900/90 border-slate-800/80 text-white'
        }`}
      >
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
              <div
                className={`text-sm sm:text-lg font-extrabold tracking-tight font-serif flex items-center gap-1.5 leading-tight ${
                  isDay ? 'text-stone-900' : 'text-white'
                }`}
              >
                <span>Chess Academy</span>
                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30">
                  IT
                </span>
              </div>
              <div className={`text-[11px] hidden sm:block ${isDay ? 'text-stone-500' : 'text-slate-400'}`}>
                Impara a giocare a scacchi • Senza stress
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            className={`hidden lg:flex items-center gap-1 p-1 rounded-2xl border transition-colors ${
              isDay
                ? 'bg-stone-200/70 border-stone-300'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : isDay
                      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Utility Controls & Day/Night Toggle & PWA Install Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Day / Night Theme Toggle Button */}
            <button
              onClick={toggleDayNight}
              className={`p-2 rounded-xl transition cursor-pointer active:scale-95 border ${
                isDay
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-amber-600'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-400'
              }`}
              title={isDay ? 'Passa a Tema Notte (Scuro)' : 'Passa a Tema Giorno (Chiaro)'}
            >
              {isDay ? (
                <Moon className="w-4 h-4 text-indigo-500" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl transition cursor-pointer active:scale-95 border ${
                isDay
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-500" />
              ) : (
                <VolumeX className="w-4 h-4 opacity-40" />
              )}
            </button>

            {/* User Profile Quick Avatar Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                activeTab === 'profile'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                  : isDay
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Apri Il Mio Profilo"
            >
              <span className="text-base select-none leading-none">{progress.profile?.avatar || '♞'}</span>
              <span className="text-xs font-bold hidden sm:inline">{progress.profile?.name || 'Profilo'}</span>
            </button>

            {/* PWA In-App Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Application Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 pb-28 lg:pb-12">
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

        {activeTab === 'profile' && (
          <ProfileView
            progress={progress}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar with Safe Area */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-1.5 pt-2 pb-safe flex items-center justify-around shadow-2xl transition-colors ${
          isDay
            ? 'bg-white/95 border-stone-200 text-stone-700'
            : 'bg-slate-900/95 border-slate-800/90 text-slate-300'
        }`}
      >
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center min-w-[42px] py-1 px-1 rounded-xl transition-all active:scale-90 cursor-pointer ${
                isActive
                  ? 'text-amber-500 font-bold bg-amber-500/15'
                  : isDay
                  ? 'text-stone-500 hover:text-stone-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.id === 'profile' ? (
                <span className={`text-base leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {progress.profile?.avatar || '♞'}
                </span>
              ) : (
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}
              <span className="text-[9px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
