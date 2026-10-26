export interface SavedGame {
  id: string;
  date: string;
  mode: 'free' | 'assisted' | 'didactic' | 'quick';
  level: number;
  playerColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw' | 'in_progress';
  moves: string[]; // SAN list, e.g. ["e4", "e5", "Nf3", ...]
  fens: string[]; // FEN at each half-move
  evaluations?: number[];
  finalFen: string;
  reason?: string;
}

export interface UserProgress {
  currentLevel: number;
  completedLessonIds: string[];
  completedPuzzleIds: string[];
  gamesPlayed: number;
  gamesWon: number;
  gamesDrawn: number;
  gamesLost: number;
  totalTimeMinutes: number;
  streakDays: number;
  lastActiveDate: string;
  lastActivity: {
    type: 'lesson' | 'puzzle' | 'game';
    title: string;
    timestamp: number;
  };
  savedGames: SavedGame[];
  unlockedBadges: string[];
}

const STORAGE_KEY = 'chess_academy_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  currentLevel: 1,
  completedLessonIds: [],
  completedPuzzleIds: [],
  gamesPlayed: 0,
  gamesWon: 0,
  gamesDrawn: 0,
  gamesLost: 0,
  totalTimeMinutes: 5,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  lastActivity: {
    type: 'lesson',
    title: "Benvenuto all'Accademia",
    timestamp: Date.now(),
  },
  savedGames: [],
  unlockedBadges: ['Iniziato'],
};

export function loadUserProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveUserProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}
