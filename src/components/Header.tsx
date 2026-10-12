import React from 'react';
import {
  Brain,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LogIn,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CognitiveMetrics, LevelDefinition, UserProfile } from '../types';
import { soundEngine } from '../services/audio';

interface HeaderProps {
  currentLevel: LevelDefinition;
  levels: LevelDefinition[];
  onSelectLevel: (levelId: number) => void;
  user: UserProfile;
  metrics: CognitiveMetrics;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLevel,
  levels,
  onSelectLevel,
  user,
  metrics,
  onOpenAuth,
  onOpenDashboard,
  isMuted,
  onToggleMute,
}) => {
  const currentIndex = levels.findIndex((l) => l.id === currentLevel.id);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < levels.length - 1;

  return (
    <header
      id="app-header"
      className="bg-slate-900 border-b border-slate-800 text-slate-100 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-4 select-none"
    >
      {/* Brand Title & Blueprint Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base tracking-tight font-['Outfit'] text-white">
              LA MÁQUINA INCREÍBLE
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 hidden xs:inline-block">
              2D TIM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            Laboratorio de Mecanismos & Análisis Cognitivo
          </p>
        </div>
      </div>

      {/* Level Navigator */}
      <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1">
        <button
          id="btn-prev-level"
          onClick={() => {
            if (canPrev) {
              soundEngine.playClick();
              onSelectLevel(levels[currentIndex - 1].id);
            }
          }}
          disabled={!canPrev}
          className={`p-1.5 rounded transition ${
            canPrev ? 'hover:bg-slate-800 text-slate-200 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Nivel anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center px-1 min-w-[120px] sm:min-w-[160px]">
          <select
            id="select-level"
            value={currentLevel.id}
            onChange={(e) => {
              soundEngine.playClick();
              onSelectLevel(Number(e.target.value));
            }}
            className="bg-transparent text-xs sm:text-sm font-semibold text-sky-300 focus:outline-none cursor-pointer text-center max-w-full truncate"
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                {l.id === 9 ? '★ ' : `${l.id}. `}
                {l.title} ({l.difficulty})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-mono">
            Dificultad: <strong className="text-amber-400">{currentLevel.difficulty}</strong>
          </span>
        </div>

        <button
          id="btn-next-level"
          onClick={() => {
            if (canNext) {
              soundEngine.playClick();
              onSelectLevel(levels[currentIndex + 1].id);
            }
          }}
          disabled={!canNext}
          className={`p-1.5 rounded transition ${
            canNext ? 'hover:bg-slate-800 text-slate-200 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Siguiente nivel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons: Cognitive Dashboard, Audio, SSO User */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Cognitive Score Pill */}
        <button
          id="btn-open-cognitive-dashboard"
          onClick={() => {
            soundEngine.playClick();
            onOpenDashboard();
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-200 text-xs font-mono transition shadow-sm cursor-pointer"
          title="Ver Panel de Análisis Cognitivo y Exportar CSV/PDF"
        >
          <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
          <div className="text-left hidden sm:block leading-tight">
            <div className="text-[9px] text-indigo-300/80 uppercase">CI Mecánico</div>
            <div className="font-bold text-white text-xs">{metrics.overallScore} pts</div>
          </div>
          <BarChart3 className="w-3.5 h-3.5 text-indigo-300 ml-0.5" />
        </button>

        {/* Audio Mute Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={() => {
            onToggleMute();
            soundEngine.playClick();
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/50"
          title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* SSO User Profile */}
        <button
          id="btn-sso-profile"
          onClick={() => {
            soundEngine.playClick();
            onOpenAuth();
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          title="Gestión de Inicio de Sesión Único (SSO)"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover border border-sky-400/50"
            referrerPolicy="no-referrer"
          />
          <span className="text-xs font-medium text-slate-200 max-w-[80px] sm:max-w-[110px] truncate hidden md:inline-block">
            {user.name.split(' ')[0]}
          </span>
          <span className="text-[9px] uppercase px-1 rounded bg-sky-950 text-sky-400 border border-sky-800/80 font-mono hidden lg:inline-block">
            SSO: {user.provider}
          </span>
        </button>
      </div>
    </header>
  );
};
