import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  StepForward,
  RotateCw,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Crosshair,
} from 'lucide-react';
import { GameItem, LevelDefinition } from '../types';
import { soundEngine } from '../services/audio';

interface ControlBarProps {
  currentLevel: LevelDefinition;
  isRunning: boolean;
  isPaused: boolean;
  simulationSpeed: number;
  selectedItem: GameItem | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRestartLevel?: () => void;
  onToggleSpeed: () => void;
  onStep: () => void;
  onRotateSelected: () => void;
  onRemoveSelected: () => void;
  onDeselect: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentLevel,
  isRunning,
  isPaused,
  simulationSpeed,
  selectedItem,
  onStart,
  onPause,
  onReset,
  onRestartLevel,
  onToggleSpeed,
  onStep,
  onRotateSelected,
  onRemoveSelected,
  onDeselect,
}) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div
      id="simulation-control-bar"
      className="bg-slate-900/95 backdrop-blur border-t border-slate-800 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4 select-none"
    >
      {/* Simulation Engine Controls (Play / Pause / Reset / Speed / Step) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isRunning || isPaused ? (
          <button
            id="btn-sim-play"
            onClick={() => {
              soundEngine.playClick();
              onStart();
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPaused ? 'Reanudar' : 'Iniciar'}</span>
          </button>
        ) : (
          <button
            id="btn-sim-pause"
            onClick={() => {
              soundEngine.playClick();
              onPause();
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/50 transition cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pausar</span>
          </button>
        )}

        <button
          id="btn-sim-reset"
          onClick={() => {
            soundEngine.playClick();
            onReset();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm transition cursor-pointer border border-slate-700"
          title="Rebobinar simulación (mantiene las piezas que has colocado)"
        >
          <RotateCcw className="w-4 h-4 text-sky-400" />
          <span className="hidden xs:inline">Rebobinar</span>
        </button>

        {onRestartLevel && (
          <button
            id="btn-restart-level"
            onClick={() => {
              soundEngine.playClick();
              onRestartLevel();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 active:scale-95 text-slate-400 text-xs sm:text-sm transition cursor-pointer border border-slate-700"
            title="Limpiar tablero y devolver piezas al inventario"
          >
            <RotateCw className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        )}

        <button
          id="btn-sim-speed"
          onClick={() => {
            soundEngine.playClick();
            onToggleSpeed();
          }}
          className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
            simulationSpeed === 2
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
          }`}
          title="Alternar velocidad de simulación"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>{simulationSpeed}x</span>
        </button>

        {isPaused && (
          <button
            id="btn-sim-step"
            onClick={() => {
              soundEngine.playClick();
              onStep();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer border border-slate-700"
            title="Avanzar 1 cuadro físico (Paso a paso)"
          >
            <StepForward className="w-4 h-4 text-sky-300" />
          </button>
        )}
      </div>

      {/* Selected Item Context Actions (Rotate, Delete) */}
      {selectedItem && !selectedItem.isFixedInLevel && !isRunning && (
        <div
          id="selected-item-actions"
          className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-sky-500/40 animate-fade-in"
        >
          <div className="flex items-center gap-1 text-[11px] font-mono text-sky-300 pr-1 border-r border-slate-800">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Seleccionado:</span>
            <span className="capitalize">{selectedItem.type.replace(/_/g, ' ')}</span>
          </div>

          <button
            id="btn-rotate-item"
            onClick={() => {
              soundEngine.playClick();
              onRotateSelected();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer"
            title="Rotar pieza 45° / 90°"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline">Rotar</span>
          </button>

          <button
            id="btn-delete-item"
            onClick={() => {
              soundEngine.playClick();
              onRemoveSelected();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs transition cursor-pointer"
            title="Eliminar pieza y regresar a inventario"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Quitar</span>
          </button>
        </div>
      )}

      {/* Objective & Hint Callout */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 max-w-xs sm:max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate font-medium text-[11px] sm:text-xs">
            <strong className="text-slate-100 font-semibold">Meta:</strong> {currentLevel.goal.description}
          </span>
        </div>

        {/* Hint button */}
        <button
          id="btn-toggle-hint"
          onClick={() => {
            soundEngine.playClick();
            setShowHint(!showHint);
          }}
          className={`p-1.5 rounded-lg transition cursor-pointer border ${
            showHint
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Pista del inventor"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Hint Popup */}
      {showHint && (
        <div className="w-full mt-1.5 p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2 animate-fade-in">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold text-amber-300">Pista de Física:</strong> {currentLevel.hint}
          </div>
          <button
            onClick={() => setShowHint(false)}
            className="text-amber-400/70 hover:text-amber-300 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
