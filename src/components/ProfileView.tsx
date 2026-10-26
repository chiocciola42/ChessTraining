import React, { useState } from 'react';
import {
  User,
  Sun,
  Moon,
  Palette,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  Award,
  Crown,
  Heart,
  Calendar,
} from 'lucide-react';
import {
  UserProfile,
  UserProgress,
} from '../utils/storage';
import {
  BOARD_THEMES,
  PIECE_THEMES,
  AVATAR_OPTIONS,
  TITLE_OPTIONS,
  BoardThemeId,
  PieceThemeId,
  ThemeMode,
} from '../utils/themes';
import { Chessboard } from './Chessboard';
import { ChessPiece } from './ChessPiece';
import { sound } from '../utils/sound';

interface ProfileViewProps {
  progress: UserProgress;
  onUpdateProfile: (updater: (prevProfile: UserProfile) => UserProfile) => void;
  onResetPreferences?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  progress,
  onUpdateProfile,
  onResetPreferences,
}) => {
  const profile = progress.profile;
  const isDay = profile.themeMode === 'day';

  const [nameInput, setNameInput] = useState(profile.name);
  const [saveToast, setSaveToast] = useState(false);

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim() || 'Giocatore';
    onUpdateProfile((p) => ({ ...p, name: trimmed }));
    sound.playMove();
    showToast();
  };

  const handleSelectAvatar = (avatarIcon: string) => {
    onUpdateProfile((p) => ({ ...p, avatar: avatarIcon }));
    sound.playMove();
    showToast();
  };

  const handleSelectTitle = (title: string) => {
    onUpdateProfile((p) => ({ ...p, title }));
    sound.playMove();
    showToast();
  };

  const handleSelectFavoritePiece = (piece: string) => {
    onUpdateProfile((p) => ({ ...p, favoritePiece: piece }));
    sound.playMove();
    showToast();
  };

  const handleToggleThemeMode = (mode: ThemeMode) => {
    onUpdateProfile((p) => ({ ...p, themeMode: mode }));
    sound.playMove();
    showToast();
  };

  const handleSelectBoardTheme = (themeId: BoardThemeId) => {
    onUpdateProfile((p) => ({ ...p, boardTheme: themeId }));
    sound.playMove();
    showToast();
  };

  const handleSelectPieceTheme = (themeId: PieceThemeId) => {
    onUpdateProfile((p) => ({ ...p, pieceTheme: themeId }));
    sound.playMove();
    showToast();
  };

  const handleToggleCoordinates = () => {
    onUpdateProfile((p) => ({ ...p, showCoordinates: !p.showCoordinates }));
    sound.playMove();
    showToast();
  };

  const handleToggleSound = () => {
    const next = !profile.soundEnabled;
    onUpdateProfile((p) => ({ ...p, soundEnabled: next }));
    sound.setEnabled(next);
    if (next) sound.playMove();
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const favoritePiecesList = [
    { name: 'Pedone', symbol: '♟', type: 'p' },
    { name: 'Cavallo', symbol: '♞', type: 'n' },
    { name: 'Alfiere', symbol: '♝', type: 'b' },
    { name: 'Torre', symbol: '♜', type: 'r' },
    { name: 'Regina', symbol: '♛', type: 'q' },
    { name: 'Re', symbol: '♚', type: 'k' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-10">
      {/* Toast feedback */}
      {saveToast && (
        <div className="fixed top-16 sm:top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4" />
          <span>Preferenze aggiornate con successo!</span>
        </div>
      )}

      {/* Profile Hero Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isDay
            ? 'bg-gradient-to-br from-amber-50 via-white to-stone-100 border-stone-200 text-stone-900'
            : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border-slate-800 text-white'
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar display badge */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-amber-300/30">
              <span className="transform group-hover:scale-110 transition-transform select-none">
                {profile.avatar}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-950 text-amber-400 border border-amber-500/40 p-1.5 rounded-xl shadow-md">
              <Crown className="w-4 h-4" />
            </div>
          </div>

          {/* User info & stats pills */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.title}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight">
              {profile.name}
            </h1>

            <p
              className={`text-xs sm:text-sm max-w-xl ${
                isDay ? 'text-stone-600' : 'text-slate-400'
              }`}
            >
              Percorso attivo da {profile.joinedDate} • Pezzo d'elezione:{' '}
              <span className="font-semibold text-amber-500">{profile.favoritePiece}</span>
            </p>

            {/* Quick stats snapshot */}
            <div className="pt-2 grid grid-cols-3 gap-2.5 max-w-md mx-auto sm:mx-0">
              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDay ? 'bg-white/80 border-stone-200' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="text-lg sm:text-xl font-extrabold text-amber-500 font-serif">
                  {progress.currentLevel} / 7
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Livello
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDay ? 'bg-white/80 border-stone-200' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="text-lg sm:text-xl font-extrabold text-amber-500 font-serif">
                  {progress.gamesPlayed}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Partite
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  isDay ? 'bg-white/80 border-stone-200' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="text-lg sm:text-xl font-extrabold text-amber-500 font-serif">
                  {progress.totalTimeMinutes}m
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Tempo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Customization Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Dati Personali (Nome, Titolo, Pezzo Preferito) */}
        <div
          className={`p-6 rounded-3xl border shadow-lg space-y-6 ${
            isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200 dark:border-slate-800">
            <User className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold font-serif">Scheda Giocatore</h2>
          </div>

          {/* Nome Input */}
          <form onSubmit={handleNameSave} className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Nome o Nickname
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                placeholder="Inserisci il tuo nome..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  isDay
                    ? 'bg-stone-50 border-stone-300 text-stone-900'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
              >
                Salva
              </button>
            </div>
          </form>

          {/* Titolo Scacchistico */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Titolo Preferito
            </label>
            <div className="flex flex-wrap gap-2">
              {TITLE_OPTIONS.map((title) => {
                const isSelected = profile.title === title;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleSelectTitle(title)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md scale-102'
                        : isDay
                        ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                        : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                    }`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pezzo Preferito */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Pezzo del Cuore
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {favoritePiecesList.map((item) => {
                const isSelected = profile.favoritePiece === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectFavoritePiece(item.name)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-500 dark:text-amber-300 font-bold shadow'
                        : isDay
                        ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{item.symbol}</span>
                    <span className="text-[10px] font-semibold">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Scegli Avatar Icon */}
        <div
          className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold font-serif">Icona Avatar</h2>
            </div>
            <span className="text-xs text-slate-400">Tocca per selezionare</span>
          </div>

          <p className={`text-xs ${isDay ? 'text-stone-500' : 'text-slate-400'}`}>
            Scegli il simbolo che ti accompagnerà durante le partite e nelle lezioni.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
            {AVATAR_OPTIONS.map((item) => {
              const isSelected = profile.avatar === item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAvatar(item.icon)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative group ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/30 border-amber-500 ring-2 ring-amber-400 text-amber-500 shadow-md scale-102'
                      : isDay
                      ? 'bg-stone-50 border-stone-200 hover:border-amber-300 hover:bg-stone-100 text-stone-800'
                      : 'bg-slate-800/70 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform select-none">
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-semibold text-center leading-tight line-clamp-1">
                    {item.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tema Giorno / Notte (Day & Night) Switch */}
      <div
        className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
          isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {isDay ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Tema Applicazione: Giorno e Notte
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300">
            {isDay ? 'Tema Giorno Attivo' : 'Tema Notte Attivo'}
          </span>
        </div>

        <p className={`text-xs ${isDay ? 'text-stone-500' : 'text-slate-400'}`}>
          Scegli l'illuminazione ideale per la tua sessione: contrasto brillante alla luce del sole o toni scuri riposanti per la sera.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Night Theme Option */}
          <div
            onClick={() => handleToggleThemeMode('night')}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
              !isDay
                ? 'bg-slate-950 border-amber-500 shadow-lg ring-1 ring-amber-400/50'
                : 'bg-stone-50 border-stone-200 hover:border-stone-400'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 shadow">
              <Moon className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white dark:text-white">
                  Tema Notte (Scuro)
                </span>
                {!isDay && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sfondo antracite profondo, riduce l'affaticamento visivo durante le sessioni serali.
              </p>
            </div>
          </div>

          {/* Day Theme Option */}
          <div
            onClick={() => handleToggleThemeMode('day')}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-4 ${
              isDay
                ? 'bg-amber-50/70 border-amber-500 shadow-lg ring-1 ring-amber-400/50'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0 shadow">
              <Sun className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-900 dark:text-white">
                  Tema Giorno (Chiaro)
                </span>
                {isDay && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDay ? 'text-stone-600' : 'text-slate-400'}`}>
                Luminoso e nitido, perfetto alla luce del giorno o all'aperto sul cellulare.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scelta Temi Scacchiera (Board Themes) */}
      <div
        className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
          isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Tema della Scacchiera (6 Stili)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Personalizza i colori delle caselle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {BOARD_THEMES.map((bTheme) => {
            const isSelected = profile.boardTheme === bTheme.id;
            return (
              <div
                key={bTheme.id}
                onClick={() => handleSelectBoardTheme(bTheme.id)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-1 ring-amber-400'
                    : isDay
                    ? 'border-stone-200 hover:border-amber-300 bg-stone-50'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{bTheme.name}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* 4-square mini preview swatch */}
                <div className="w-full h-12 rounded-xl overflow-hidden grid grid-cols-4 border border-black/20 shadow-inner">
                  <div style={{ backgroundColor: bTheme.lightColor }} />
                  <div style={{ backgroundColor: bTheme.darkColor }} />
                  <div style={{ backgroundColor: bTheme.lightColor }} />
                  <div style={{ backgroundColor: bTheme.darkColor }} />
                </div>

                <p
                  className={`text-xs line-clamp-2 ${
                    isDay ? 'text-stone-500' : 'text-slate-400'
                  }`}
                >
                  {bTheme.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scelta Temi Pezzi da Gioco (Piece Themes) */}
      <div
        className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
          isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Stile dei Pezzi da Gioco (4 Collezione)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Modifica finitura e riflessi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {PIECE_THEMES.map((pTheme) => {
            const isSelected = profile.pieceTheme === pTheme.id;
            return (
              <div
                key={pTheme.id}
                onClick={() => handleSelectPieceTheme(pTheme.id)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-1 ring-amber-400'
                    : isDay
                    ? 'border-stone-200 hover:border-amber-300 bg-stone-50'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{pTheme.name}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Mini preview with SVG pieces */}
                <div className="flex items-center justify-around py-2 px-1 rounded-xl bg-slate-950/40 border border-slate-700/40">
                  <div className="w-8 h-8">
                    <ChessPiece type="k" color="w" pieceTheme={pTheme.id} />
                  </div>
                  <div className="w-8 h-8">
                    <ChessPiece type="n" color="b" pieceTheme={pTheme.id} />
                  </div>
                  <div className="w-8 h-8">
                    <ChessPiece type="q" color="w" pieceTheme={pTheme.id} />
                  </div>
                </div>

                <p
                  className={`text-xs line-clamp-2 ${
                    isDay ? 'text-stone-500' : 'text-slate-400'
                  }`}
                >
                  {pTheme.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anteprima Live Scacchiera con i Temi Scelti */}
      <div
        className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          isDay ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold font-serif">
              Anteprima dal Vivo della Scacchiera
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Trascina o tocca i pezzi per provare la sensazione di gioco
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 justify-center pt-2">
          <div className="w-full max-w-[360px]">
            <Chessboard
              boardTheme={profile.boardTheme}
              pieceTheme={profile.pieceTheme}
              showCoordinates={profile.showCoordinates}
              interactive={true}
            />
          </div>

          {/* Quick theme adjustments next to preview */}
          <div className="w-full max-w-sm space-y-4 text-xs">
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDay ? 'bg-stone-50 border-stone-200' : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <div className="font-bold text-sm">Opzioni Visualizzazione</div>

              {/* Coordinates Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Coordinate algebriche (a-h, 1-8)</div>
                  <div className="text-[11px] text-slate-400">
                    Utili per memorizzare le posizioni
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCoordinates}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                    profile.showCoordinates ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                </button>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                <div>
                  <div className="font-semibold">Effetti Sonori</div>
                  <div className="text-[11px] text-slate-400">
                    Suono mossa, cattura, scacco e vittoria
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                    profile.soundEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                </button>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isDay
                  ? 'bg-amber-50/80 border-amber-200 text-stone-700'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-200/90'
              }`}
            >
              Le modifiche scelte si riflettono automaticamente in tutte le sezioni di gioco, nelle lezioni e nei problemi!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
