import { BoardThemeId, PieceThemeId, ThemeMode } from './themes';

export interface SavedGame {
  id: string;
  date: string;
  mode: 'free' | 'assisted' | 'didactic' | 'quick';
  level: number;
  playerColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw' | 'in_progress';
  moves: string[];
  fens: string[];
  evaluations?: number[];
  finalFen: string;
  reason?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  title: string;
  favoritePiece: string;
  joinedDate: string;
  themeMode: ThemeMode;
  boardTheme: BoardThemeId;
  pieceTheme: PieceThemeId;
  showCoordinates: boolean;
  soundEnabled: boolean;
}

export interface UserProgress {
  profile: UserProfile;
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

/** In-progress game snapshot used to resume a match after a reload. */
export interface ActiveGameState {
  fen: string;
  mode: SavedGame['mode'];
  level: number;
  playerColor: 'w' | 'b';
  moves: string[];
  fens: string[];
}

const STORAGE_KEY = 'chess_academy_user_progress_v2';
const LEGACY_STORAGE_KEY = 'chess_academy_user_progress_v1';
const ACTIVE_GAME_KEY = 'chess_academy_active_game_state';

/** Upper bounds for persisted data: protect against corrupted or oversized storage. */
const MAX_SAVED_GAMES = 20;
const MAX_PLIES = 1000;

const GAME_MODES: ReadonlyArray<SavedGame['mode']> = ['free', 'assisted', 'didactic', 'quick'];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Stefano',
  avatar: '♞',
  title: 'Principiante Appassionato',
  favoritePiece: 'Cavallo',
  joinedDate: 'Ottobre 2026',
  themeMode: 'night',
  boardTheme: 'wood',
  pieceTheme: 'staunton',
  showCoordinates: true,
  soundEnabled: true,
};

function createDefaultProgress(): UserProgress {
  return {
    profile: { ...DEFAULT_PROFILE },
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Merges untrusted stored data over the defaults, keeping a field only when it
 * has the expected type. Anything malformed silently falls back to the default.
 */
function sanitizeProgress(raw: unknown): UserProgress {
  const base = createDefaultProgress();
  if (!isRecord(raw)) return base;

  const profile = isRecord(raw.profile) ? { ...base.profile, ...raw.profile } : base.profile;
  const numericKeys = [
    'currentLevel',
    'gamesPlayed',
    'gamesWon',
    'gamesDrawn',
    'gamesLost',
    'totalTimeMinutes',
    'streakDays',
  ] as const;

  const next: UserProgress = { ...base, profile: profile as UserProfile };
  for (const key of numericKeys) {
    if (isFiniteNumber(raw[key])) next[key] = raw[key];
  }
  if (isStringArray(raw.completedLessonIds)) next.completedLessonIds = raw.completedLessonIds;
  if (isStringArray(raw.completedPuzzleIds)) next.completedPuzzleIds = raw.completedPuzzleIds;
  if (isStringArray(raw.unlockedBadges)) next.unlockedBadges = raw.unlockedBadges;
  if (typeof raw.lastActiveDate === 'string') next.lastActiveDate = raw.lastActiveDate;
  if (Array.isArray(raw.savedGames)) {
    next.savedGames = (raw.savedGames as SavedGame[]).slice(0, MAX_SAVED_GAMES);
  }
  if (isRecord(raw.lastActivity)) {
    next.lastActivity = { ...base.lastActivity, ...raw.lastActivity } as UserProgress['lastActivity'];
  }
  return next;
}

export function loadUserProgress(): UserProgress {
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    return sanitizeProgress(JSON.parse(raw));
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
    return createDefaultProgress();
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

/** Removes only this app's keys (never the whole origin storage) and returns fresh defaults. */
export function resetUserProgress(): UserProgress {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_GAME_KEY);
    } catch (e) {
      console.error('Failed to reset progress in localStorage', e);
    }
  }
  return createDefaultProgress();
}

function sanitizeActiveGame(raw: unknown): ActiveGameState | null {
  if (!isRecord(raw)) return null;
  const { fen, mode, level, playerColor, moves, fens } = raw;
  if (typeof fen !== 'string' || fen.length === 0) return null;
  if (!GAME_MODES.includes(mode as SavedGame['mode'])) return null;
  if (!isFiniteNumber(level) || level < 1 || level > 6) return null;
  if (playerColor !== 'w' && playerColor !== 'b') return null;
  if (!isStringArray(moves) || !isStringArray(fens)) return null;
  if (moves.length > MAX_PLIES || fens.length > MAX_PLIES + 1) return null;
  return { fen, mode: mode as SavedGame['mode'], level, playerColor, moves, fens };
}

export function loadActiveGame(): ActiveGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY);
    return raw ? sanitizeActiveGame(JSON.parse(raw)) : null;
  } catch (e) {
    console.error('Failed to load active game from localStorage', e);
    return null;
  }
}

export function saveActiveGame(state: ActiveGameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save active game to localStorage', e);
  }
}

export function clearActiveGame(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch (e) {
    console.error('Failed to clear active game from localStorage', e);
  }
}
