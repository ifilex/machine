import React, { useState } from 'react';
import {
  CircleDot,
  Circle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowUpCircle,
  Scale,
  Cog,
  ArrowRightSquare,
  ArrowLeftSquare,
  Wind,
  Flame,
  Rocket,
  ToggleRight,
  Zap,
  Bell,
  ShoppingBag,
  Pin,
  Box,
  HelpCircle,
} from 'lucide-react';
import { MechanismType, ToolboxItemDefinition } from '../types';
import { TOOLBOX_CATALOG } from '../data/levels';
import { soundEngine } from '../services/audio';

interface ToolboxProps {
  availableInventory: { type: MechanismType; count: number }[];
  selectedTool: MechanismType | null;
  onSelectTool: (type: MechanismType | null) => void;
  onSpawnItem: (type: MechanismType) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  CircleDot: <CircleDot className="w-5 h-5 text-zinc-300" />,
  Circle: <Circle className="w-5 h-5 text-yellow-300" />,
  Sparkles: <Sparkles className="w-5 h-5 text-pink-400" />,
  TrendingDown: <TrendingDown className="w-5 h-5 text-amber-500" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-amber-500" />,
  ArrowUpCircle: <ArrowUpCircle className="w-5 h-5 text-sky-400" />,
  Scale: <Scale className="w-5 h-5 text-orange-400" />,
  Cog: <Cog className="w-5 h-5 text-slate-300 animate-[spin_6s_linear_infinite]" />,
  ArrowRightSquare: <ArrowRightSquare className="w-5 h-5 text-emerald-400" />,
  ArrowLeftSquare: <ArrowLeftSquare className="w-5 h-5 text-emerald-400" />,
  Wind: <Wind className="w-5 h-5 text-cyan-300" />,
  Flame: <Flame className="w-5 h-5 text-orange-500" />,
  Rocket: <Rocket className="w-5 h-5 text-red-500" />,
  ToggleRight: <ToggleRight className="w-5 h-5 text-indigo-400" />,
  Zap: <Zap className="w-5 h-5 text-amber-400" />,
  Bell: <Bell className="w-5 h-5 text-yellow-400" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5 text-amber-600" />,
  Pin: <Pin className="w-5 h-5 text-slate-200" />,
};

export const Toolbox: React.FC<ToolboxProps> = ({
  availableInventory,
  selectedTool,
  onSelectTool,
  onSpawnItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [hoveredInfo, setHoveredInfo] = useState<ToolboxItemDefinition | null>(null);

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'proyectiles', label: 'Pelotas' },
    { id: 'propulsion', label: 'Propulsión' },
    { id: 'transmision', label: 'Transmisión' },
    { id: 'estructuras', label: 'Rampas' },
    { id: 'logica', label: 'Lógica' },
  ];

  const filteredItems = availableInventory.filter((inv) => {
    if (inv.count <= 0) return false;
    const def = TOOLBOX_CATALOG[inv.type];
    if (!def) return false;
    if (activeCategory === 'todos') return true;
    return def.category === activeCategory;
  });

  return (
    <div
      id="toolbox-container"
      className="bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 flex flex-col shrink-0 sm:w-72 lg:w-80 select-none max-h-[38vh] sm:max-h-full overflow-hidden"
    >
      {/* Toolbox Header */}
      <div className="p-2 sm:p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide font-['Outfit'] uppercase">
            Caja de Mecanismos
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Disponibles: {availableInventory.reduce((acc, i) => acc + i.count, 0)}
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/80 bg-slate-950/40">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`filter-${cat.id}`}
            onClick={() => {
              soundEngine.playClick();
              setActiveCategory(cat.id);
            }}
            className={`px-2 py-1 text-[11px] rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="p-2 sm:p-3 flex-1 overflow-y-auto space-y-1.5 sm:space-y-2">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono">
            No hay piezas disponibles en esta categoría.
          </div>
        ) : (
          filteredItems.map((inv) => {
            const def = TOOLBOX_CATALOG[inv.type];
            if (!def) return null;
            const isSelected = selectedTool === inv.type;

            return (
              <div
                key={inv.type}
                id={`tool-item-${inv.type}`}
                onClick={() => {
                  soundEngine.playClick();
                  if (isSelected) {
                    onSelectTool(null);
                  } else {
                    onSelectTool(inv.type);
                    onSpawnItem(inv.type);
                  }
                }}
                onMouseEnter={() => setHoveredInfo(def)}
                onMouseLeave={() => setHoveredInfo(null)}
                className={`group p-2 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-900 border border-slate-700/80'
                    }`}
                  >
                    {ICON_MAP[def.icon] || <Box className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-slate-100 truncate group-hover:text-sky-300 transition">
                      {def.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[170px]">
                      {def.description}
                    </p>
                  </div>
                </div>

                {/* Stock Count Badge */}
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-sky-300">
                    x{inv.count}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mechanism Details Tooltip / Status Footer */}
      <div className="p-2 sm:p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
        <span className="leading-snug">
          {hoveredInfo
            ? hoveredInfo.description
            : 'Haz clic o toca una pieza para agregarla al tapete. Arrástrala para ubicarla.'}
        </span>
      </div>
    </div>
  );
};
