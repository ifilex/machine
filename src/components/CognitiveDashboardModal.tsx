import React, { useState } from 'react';
import {
  Brain,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Award,
  TrendingUp,
  Activity,
  Compass,
  Zap,
  Target,
  Clock,
  RotateCw,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { CognitiveMetrics, LevelAttemptRecord, UserProfile } from '../types';
import { CognitiveEngine } from '../services/cognitiveEngine';
import { exportToCSV, exportToPDF } from '../services/reportExporter';
import { soundEngine } from '../services/audio';

interface CognitiveDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  metrics: CognitiveMetrics;
  cognitiveEngine: CognitiveEngine;
}

export const CognitiveDashboardModal: React.FC<CognitiveDashboardModalProps> = ({
  isOpen,
  onClose,
  user,
  metrics,
  cognitiveEngine,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'telemetria' | 'historial'>('radar');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const profile = cognitiveEngine.getCognitiveProfile();
  const attempts = cognitiveEngine.getAllAttempts();
  const recentEvents = cognitiveEngine.getRecentEvents();

  const handleExportCSV = () => {
    soundEngine.playClick();
    exportToCSV(user, metrics, attempts);
  };

  const handleExportPDF = () => {
    soundEngine.playClick();
    setIsExporting(true);
    setTimeout(() => {
      exportToPDF(user, metrics, attempts, profile);
      setIsExporting(false);
    }, 150);
  };

  // Dimensions for Spider Radar Chart
  const radarDimensions = [
    { label: 'Razonamiento Espacial', value: metrics.spatialReasoning, icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Eficiencia Resolutiva', value: metrics.problemSolvingEfficiency, icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Lógica Causal', value: metrics.causalLogicChaining, icon: <Activity className="w-3.5 h-3.5" /> },
    { label: 'Flexibilidad Cognitiva', value: metrics.cognitiveFlexibility, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { label: 'Perseverancia', value: metrics.perseveranceIndex, icon: <Target className="w-3.5 h-3.5" /> },
    { label: 'Deliberación Previa', value: metrics.deliberationRatio, icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  // SVG Radar Coordinates Calculation
  const size = 260;
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (Math.PI * 2) / radarDimensions.length;

  const polygonPoints = radarDimensions
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (dim.value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      id="cognitive-dashboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-['Outfit'] tracking-tight flex items-center gap-2">
                Panel de Análisis Cognitivo & Telemetría
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  EN VIVO
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Sujeto: <strong className="text-slate-200">{user.name}</strong> ({user.role}) — SSO: {user.provider.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            id="btn-close-dashboard"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Export Actions */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'radar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Perfil & Radar
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'historial' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Progreso por Nivel
            </button>
            <button
              onClick={() => setActiveTab('telemetria')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'telemetria' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auditoría de Eventos
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-medium transition cursor-pointer shadow-sm active:scale-95"
              title="Descargar telemetría en formato de hoja de cálculo CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              id="btn-export-pdf"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Generar y descargar informe neurocognitivo en PDF con jsPDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generando...' : 'Descargar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'radar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Spider Radar Chart */}
              <div className="lg:col-span-5 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Polígono Cognitivo
                  </span>
                  <span className="text-xs font-mono text-sky-400 font-bold">
                    CI: {metrics.overallScore} / 100
                  </span>
                </div>

                {/* Radar SVG */}
                <svg width={size} height={size} className="overflow-visible my-1">
                  {/* Concentric Reference Rings */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring, idx) => (
                    <circle
                      key={idx}
                      cx={center}
                      cy={center}
                      r={radius * ring}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.15)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Spokes */}
                  {radarDimensions.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.2)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Shaded Value Polygon */}
                  <polygon
                    points={polygonPoints}
                    fill="rgba(99, 102, 241, 0.3)"
                    stroke="#818cf8"
                    strokeWidth="2.5"
                  />

                  {/* Vertex Dots and Labels */}
                  {radarDimensions.map((dim, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const r = (dim.value / 100) * radius;
                    const vx = center + r * Math.cos(angle);
                    const vy = center + r * Math.sin(angle);

                    const labelR = radius + 18;
                    const lx = center + labelR * Math.cos(angle);
                    const ly = center + labelR * Math.sin(angle);

                    return (
                      <g key={i}>
                        <circle cx={vx} cy={vy} r="4" fill="#38bdf8" />
                        <text
                          x={lx}
                          y={ly}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor={lx > center + 10 ? 'start' : lx < center - 10 ? 'end' : 'middle'}
                          alignmentBaseline="middle"
                          fontFamily="monospace"
                        >
                          {dim.value}%
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Dimension Legend / Progress Bars */}
                <div className="w-full space-y-2 mt-3 pt-3 border-t border-slate-800">
                  {radarDimensions.map((dim, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-slate-300 flex items-center gap-1">
                          {dim.icon}
                          {dim.label}
                        </span>
                        <span className="font-mono text-sky-400 font-semibold">{dim.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Archetype Profile & Diagnosis */}
              <div className="lg:col-span-7 space-y-4">
                {/* Archetype Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase mb-1">
                    <Sparkles className="w-4 h-4" />
                    Arquetipo Cognitivo Detectado
                  </div>
                  <h2 className="text-lg font-bold text-white font-['Outfit']">
                    {profile.archetype}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                {/* Strengths & Development Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/50">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Fortalezas Demostradas
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {profile.strengths.map((st, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-900/50">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Áreas de Oportunidad
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {profile.developmentAreas.map((da, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{da}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Desafíos Superados</div>
                    <div className="text-xl font-bold text-white font-mono mt-0.5">
                      {attempts.filter((a) => a.completed).length} / 8
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Intentos Totales</div>
                    <div className="text-xl font-bold text-sky-400 font-mono mt-0.5">
                      {attempts.reduce((acc, a) => acc + a.attemptsCount, 0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Puntuación Total</div>
                    <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                      {attempts.reduce((acc, a) => acc + a.score, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Registro cronológico de resolución física por nivel</span>
                <span>Exportable a CSV / PDF</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Nivel</th>
                      <th className="p-2.5">Dificultad</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5">Intentos</th>
                      <th className="p-2.5">T. Planificación</th>
                      <th className="p-2.5">Piezas Usadas</th>
                      <th className="p-2.5">Puntuación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attempts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 font-mono">
                          Aún no has iniciado ningún desafío. ¡Ejecuta una máquina para comenzar!
                        </td>
                      </tr>
                    ) : (
                      attempts.map((att) => (
                        <tr key={att.levelId} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-medium text-slate-200">
                            {att.levelId}. {att.levelTitle}
                          </td>
                          <td className="p-2.5 font-mono text-slate-400">{att.difficulty}</td>
                          <td className="p-2.5">
                            {att.completed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px] font-medium">
                                Superado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[11px] font-medium">
                                En Curso
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-slate-300">{att.attemptsCount}</td>
                          <td className="p-2.5 font-mono text-slate-300">{att.planningTimeSeconds}s</td>
                          <td className="p-2.5 font-mono text-slate-300">{att.partsUsed}</td>
                          <td className="p-2.5 font-mono font-bold text-sky-400">{att.score} pts</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'telemetria' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Flujo de telemetría de interacción en tiempo real (Últimas 60 acciones)</span>
                <span className="font-mono text-sky-400">{recentEvents.length} eventos registrados</span>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {recentEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-mono">
                    Sin eventos registrados aún. Arrastra piezas o inicia la simulación.
                  </div>
                ) : (
                  recentEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-sky-400 font-semibold">{evt.action}</span>
                        <span className="text-slate-400 text-[11px]">Nivel {evt.levelId}</span>
                      </div>
                      {evt.details && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {JSON.stringify(evt.details)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Métricas calibradas según estándares psicométricos de resolución de problemas.</span>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Deseas reiniciar todas las métricas y eventos de telemetría?')) {
                cognitiveEngine.resetAllData();
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-xs font-mono transition cursor-pointer"
          >
            Reiniciar datos
          </button>
        </div>
      </div>
    </div>
  );
};
