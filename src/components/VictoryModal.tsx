import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Brain,
} from 'lucide-react';
import { LevelDefinition } from '../types';
import { soundEngine } from '../services/audio';

interface VictoryModalProps {
  isOpen: boolean;
  level: LevelDefinition;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenDashboard: () => void;
  attemptsCount: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  level,
  onNextLevel,
  onReplay,
  onOpenDashboard,
  attemptsCount,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#a855f7'],
        });
      } catch (e) {
        // Safe fallback if canvas-confetti is in restricted context
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="level-victory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 text-center p-6 space-y-5">
        {/* Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold">
            ¡MÁQUINA COMPLETADA CON ÉXITO!
          </span>
          <h2 className="text-xl font-bold font-['Outfit'] text-white mt-1">
            Nivel {level.id}: {level.title}
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {level.goal.completedText}
          </p>
        </div>

        {/* Cognitive & Physics Achievements */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="text-left">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Intentos requeridos:</span>
            <div className="font-bold text-sky-400 font-mono text-sm">{attemptsCount} intentos</div>
          </div>
          <div className="text-left">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Dificultad superada:</span>
            <div className="font-bold text-amber-400 font-mono text-sm">{level.difficulty}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {level.id < 8 && (
            <button
              id="btn-victory-next-level"
              onClick={() => {
                soundEngine.playClick();
                onNextLevel();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition cursor-pointer"
            >
              <span>Siguiente Nivel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              id="btn-victory-replay"
              onClick={() => {
                soundEngine.playClick();
                onReplay();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver Máquina</span>
            </button>

            <button
              id="btn-victory-dashboard"
              onClick={() => {
                soundEngine.playClick();
                onOpenDashboard();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Reporte Cognitivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
