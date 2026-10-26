export type ThemeMode = 'night' | 'day';

export type BoardThemeId = 'wood' | 'emerald' | 'ocean' | 'slate' | 'crimson' | 'monochrome';

export type PieceThemeId = 'staunton' | 'wood' | 'gold' | 'minimal';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  description: string;
  darkColor: string;
  lightColor: string;
  darkNotation: string;
  lightNotation: string;
  previewBg: string;
}

export interface PieceTheme {
  id: PieceThemeId;
  name: string;
  description: string;
  whiteFill: string;
  whiteStroke: string;
  whiteHighlight: string;
  blackFill: string;
  blackStroke: string;
  blackHighlight: string;
  previewIcon: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'wood',
    name: 'Legno Classico',
    description: 'Noce e betulla naturale, il calore della scacchiera da circolo.',
    darkColor: '#936c4b',
    lightColor: '#ebd7b2',
    darkNotation: '#ebd7b2',
    lightNotation: '#936c4b',
    previewBg: 'from-[#ebd7b2] to-[#936c4b]',
  },
  {
    id: 'emerald',
    name: 'Verde Torneo',
    description: 'Smeraldo e avorio, standard dei campionati internazionali FIDE.',
    darkColor: '#4a7c59',
    lightColor: '#e8eed5',
    darkNotation: '#e8eed5',
    lightNotation: '#4a7c59',
    previewBg: 'from-[#e8eed5] to-[#4a7c59]',
  },
  {
    id: 'ocean',
    name: 'Blu Oceano Reale',
    description: 'Zaffiro profondo e ghiaccio, moderno e rilassante per gli occhi.',
    darkColor: '#2b4365',
    lightColor: '#c3d7ee',
    darkNotation: '#c3d7ee',
    lightNotation: '#2b4365',
    previewBg: 'from-[#c3d7ee] to-[#2b4365]',
  },
  {
    id: 'slate',
    name: 'Ardesia & Grafite',
    description: 'Toni contemporanei minimalisti grigio scuro e platino.',
    darkColor: '#334155',
    lightColor: '#94a3b8',
    darkNotation: '#f1f5f9',
    lightNotation: '#1e293b',
    previewBg: 'from-[#94a3b8] to-[#334155]',
  },
  {
    id: 'crimson',
    name: 'Cremisi & Oro',
    description: 'Bordeaux imperiale e sabbia dorata, atmosfera regale e prestigiosa.',
    darkColor: '#7f1d1d',
    lightColor: '#fef3c7',
    darkNotation: '#fef3c7',
    lightNotation: '#7f1d1d',
    previewBg: 'from-[#fef3c7] to-[#7f1d1d]',
  },
  {
    id: 'monochrome',
    name: 'Monocromo Assoluto',
    description: 'Contrasto purissimo bianco e nero, massima nitidezza visiva.',
    darkColor: '#18181b',
    lightColor: '#f4f4f5',
    darkNotation: '#f4f4f5',
    lightNotation: '#18181b',
    previewBg: 'from-[#f4f4f5] to-[#18181b]',
  },
];

export const PIECE_THEMES: PieceTheme[] = [
  {
    id: 'staunton',
    name: 'Classico Staunton',
    description: 'Il design immortale ufficiale dal 1849 con bordi nitidi.',
    whiteFill: '#ffffff',
    whiteStroke: '#334155',
    whiteHighlight: '#f8fafc',
    blackFill: '#1e293b',
    blackStroke: '#000000',
    blackHighlight: '#475569',
    previewIcon: '♔',
  },
  {
    id: 'wood',
    name: 'Legno & Avorio',
    description: 'Calde sfumature di bosso intagliato e palissandro bruno.',
    whiteFill: '#fef08a',
    whiteStroke: '#854d0e',
    whiteHighlight: '#fef9c3',
    blackFill: '#451a03',
    blackStroke: '#290f02',
    blackHighlight: '#78350f',
    previewIcon: '♘',
  },
  {
    id: 'gold',
    name: 'Oro & Onice',
    description: 'Luminoso metallo dorato lucido contro onice profondo.',
    whiteFill: '#fbbf24',
    whiteStroke: '#b45309',
    whiteHighlight: '#fef08a',
    blackFill: '#090d16',
    blackStroke: '#38bdf8',
    blackHighlight: '#1e293b',
    previewIcon: '♕',
  },
  {
    id: 'minimal',
    name: 'Grafite & Ghiaccio',
    description: 'Tratto moderno con riflessi smeraldo e finitura opaca.',
    whiteFill: '#ecfdf5',
    whiteStroke: '#059669',
    whiteHighlight: '#d1fae5',
    blackFill: '#111827',
    blackStroke: '#10b981',
    blackHighlight: '#1f2937',
    previewIcon: '♖',
  },
];

export const AVATAR_OPTIONS = [
  { id: 'knight', icon: '♞', label: 'Cavallo Nobile' },
  { id: 'king', icon: '♔', label: 'Re Saggio' },
  { id: 'queen', icon: '♕', label: 'Regina Invitta' },
  { id: 'rook', icon: '♖', label: 'Torre Guardiana' },
  { id: 'bishop', icon: '♗', label: 'Alfiere Veloce' },
  { id: 'lion', icon: '🦁', label: 'Leone Audace' },
  { id: 'owl', icon: '🦉', label: 'Gufo Ragionato' },
  { id: 'eagle', icon: '🦅', label: 'Aquila Vista' },
  { id: 'scholar', icon: '🎓', label: 'Studioso' },
  { id: 'spark', icon: '⚡', label: 'Lampo Tattico' },
  { id: 'flame', icon: '🔥', label: 'Fuoco Sacro' },
  { id: 'crown', icon: '👑', label: 'Corona d’Oro' },
];

export const TITLE_OPTIONS = [
  'Principiante Appassionato',
  'Stratega del Weekend',
  'Mente Curiosa',
  'Cacciatore di Matti',
  'Maestro della Logica',
  'Tattico del Pomeriggio',
  'Filosofo della Scacchiera',
];
