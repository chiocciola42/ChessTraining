import React from 'react';
import { Swords, Sliders, Play, Sparkles, ChevronRight, Lightbulb } from 'lucide-react';
import type { SavedGame } from '../utils/storage';

type GameMode = SavedGame['mode'];

interface PlaySetupProps {
  gameMode: GameMode;
  difficultyLevel: number;
  playerColor: 'w' | 'b';
  onDifficultyChange: (level: number) => void;
  onColorChange: (color: 'w' | 'b') => void;
  onStart: (mode: GameMode, level: number, color: 'w' | 'b') => void;
}

interface ModeCard {
  mode: GameMode;
  badge: string;
  title: string;
  description: string;
  cta: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** Fixed settings for one-click modes; null keeps the player's custom configuration. */
  preset: { level: number; color: 'w' | 'b' } | null;
  container: string;
  badgeClass: string;
  iconClass: string;
  titleClass: string;
  ctaClass: string;
}

const MODE_CARDS: ReadonlyArray<ModeCard> = [
  {
    mode: 'assisted',
    badge: 'Consigliata per te',
    title: 'Partita Assistita',
    description:
      'Hai al tuo fianco un maestro discreto: evidenzia le mosse legali, segnala i pezzi minacciati e ti avvisa prima di un errore grave.',
    cta: 'Inizia Assistita',
    Icon: Sparkles,
    preset: null,
    container:
      'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 font-bold',
    iconClass: 'text-emerald-400',
    titleClass: 'group-hover:text-emerald-300',
    ctaClass: 'text-emerald-400',
  },
  {
    mode: 'free',
    badge: 'Classica',
    title: 'Partita Libera',
    description:
      'Scacchi puri al 100%: nessun limite di tempo, possibilità di annullare qualsiasi mossa e salvataggio automatico.',
    cta: 'Inizia Partita Libera',
    Icon: Swords,
    preset: null,
    container: 'bg-slate-900 border border-slate-800 hover:border-amber-500/50',
    badgeClass: 'bg-slate-800 text-slate-300 font-medium',
    iconClass: 'text-amber-400',
    titleClass: 'group-hover:text-amber-300',
    ctaClass: 'text-amber-400',
  },
  {
    mode: 'didactic',
    badge: 'Impara Giocando',
    title: 'Partita Didattica',
    description:
      'Il computer commenta le posizioni chiave ("Attenzione al cavallo!", "Ottima spinta al centro") aiutandoti a capire la strategia.',
    cta: 'Inizia Didattica',
    Icon: Lightbulb,
    preset: null,
    container: 'bg-slate-900 border border-slate-800 hover:border-purple-500/50',
    badgeClass: 'bg-slate-800 text-purple-300 font-medium',
    iconClass: 'text-purple-400',
    titleClass: 'group-hover:text-purple-300',
    ctaClass: 'text-purple-400',
  },
  {
    mode: 'quick',
    badge: 'Un Click',
    title: 'Partita Veloce',
    description:
      'Via subito! Avversario facile, nessun menu di configurazione, pronti a giocare in un solo secondo.',
    cta: 'Avvia Veloce',
    Icon: Play,
    preset: { level: 2, color: 'w' },
    container: 'bg-slate-900 border border-slate-800 hover:border-cyan-500/50',
    badgeClass: 'bg-slate-800 text-cyan-300 font-medium',
    iconClass: 'text-cyan-400',
    titleClass: 'group-hover:text-cyan-300',
    ctaClass: 'text-cyan-400',
  },
];

const DIFFICULTY_LEVELS: ReadonlyArray<{ lvl: number; name: string; desc: string }> = [
  { lvl: 1, name: 'Assoluto', desc: 'Errori frequenti' },
  { lvl: 2, name: 'Principiante', desc: 'Semplice' },
  { lvl: 3, name: 'Facile', desc: 'Difesa base' },
  { lvl: 4, name: 'Intermedio', desc: 'Ragionato' },
  { lvl: 5, name: 'Avanzato', desc: 'Impegnativo' },
  { lvl: 6, name: 'Esperto', desc: 'Massima forza' },
];

const ModeCardButton: React.FC<{ card: ModeCard; onSelect: () => void }> = ({ card, onSelect }) => {
  const { Icon } = card;
  return (
    <div
      onClick={onSelect}
      className={`group rounded-2xl p-6 cursor-pointer transition shadow-xl hover:-translate-y-0.5 ${card.container}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2.5 py-0.5 rounded-full ${card.badgeClass}`}>{card.badge}</span>
        <Icon className={`w-5 h-5 ${card.iconClass}`} />
      </div>
      <h3 className={`text-lg font-bold text-white mt-3 font-serif transition-colors ${card.titleClass}`}>
        {card.title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">{card.description}</p>
      <div className={`mt-4 flex items-center gap-2 text-xs font-bold ${card.ctaClass}`}>
        <span>{card.cta}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};

export const PlaySetup: React.FC<PlaySetupProps> = ({
  gameMode,
  difficultyLevel,
  playerColor,
  onDifficultyChange,
  onColorChange,
  onStart,
}) => (
  <div className="max-w-4xl mx-auto space-y-8 pb-12">
    <div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <Swords className="w-3.5 h-3.5" />
        <span>Sfida il Computer</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-serif">Gioca una Partita</h1>
      <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
        Scegli tra quattro modalità create per il puro piacere di giocare, senza fretta né ansia da prestazione.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MODE_CARDS.map((card) => (
        <ModeCardButton
          key={card.mode}
          card={card}
          onSelect={() =>
            onStart(card.mode, card.preset?.level ?? difficultyLevel, card.preset?.color ?? playerColor)
          }
        />
      ))}
    </div>

    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex items-center gap-2 text-base font-bold text-white">
        <Sliders className="w-5 h-5 text-amber-400" />
        <span>Configurazione Partita Personalizzata</span>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Livello Avversario Computer:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {DIFFICULTY_LEVELS.map((item) => (
            <button
              key={item.lvl}
              onClick={() => onDifficultyChange(item.lvl)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                difficultyLevel === item.lvl
                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold">Livello {item.lvl}</div>
              <div className="text-xs font-semibold mt-0.5 text-amber-300">{item.name}</div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Scegli con che colore giocare:
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onColorChange('w')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
              playerColor === 'w'
                ? 'bg-white text-slate-900 border-amber-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚪ Bianchi (Muovi per primo)</span>
          </button>
          <button
            onClick={() => onColorChange('b')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
              playerColor === 'b'
                ? 'bg-slate-950 text-white border-amber-400 shadow-md ring-1 ring-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚫ Neri (Rispondi al computer)</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => onStart(gameMode, difficultyLevel, playerColor)}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-base shadow-xl hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
      >
        <Play className="w-5 h-5 fill-slate-950" />
        <span>Comincia Partita Ora</span>
      </button>
    </div>
  </div>
);
