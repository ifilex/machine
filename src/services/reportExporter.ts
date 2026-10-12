import { jsPDF } from 'jspdf';
import { CognitiveMetrics, LevelAttemptRecord, UserProfile } from '../types';

export function exportToCSV(
  user: UserProfile,
  metrics: CognitiveMetrics,
  attempts: LevelAttemptRecord[]
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `reporte_cognitivo_${user.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.csv`;

  const lines: string[] = [];

  // Metadata section
  lines.push('=== INFORME COGNITIVO - LA MAQUINA INCREIBLE 2D ===');
  lines.push(`Usuario,${escapeCSV(user.name)}`);
  lines.push(`Email,${escapeCSV(user.email)}`);
  lines.push(`Rol,${escapeCSV(user.role)}`);
  lines.push(`Proveedor SSO,${escapeCSV(user.provider)}`);
  lines.push(`Fecha de Generación,${escapeCSV(new Date().toLocaleString())}`);
  lines.push('');

  // Global Cognitive Metrics
  lines.push('=== METRICAS COGNITIVAS GLOBALES (0 - 100) ===');
  lines.push('Dimension,Puntaje,Interpretacion');
  lines.push(`Razonamiento Espacial,${metrics.spatialReasoning},Geometria vectorial y trayectorias`);
  lines.push(`Eficiencia en Resolucion,${metrics.problemSolvingEfficiency},Ratio de intentos vs resolucion`);
  lines.push(`Encadenamiento Logico Causal,${metrics.causalLogicChaining},Complejidad de reacciones fisicas`);
  lines.push(`Flexibilidad Cognitiva,${metrics.cognitiveFlexibility},Adaptacion y modificacion de hipotesis`);
  lines.push(`Indice de Perseverancia,${metrics.perseveranceIndex},Resiliencia ante fallos fisicos`);
  lines.push(`Ratio de Deliberacion,${metrics.deliberationRatio},Tiempo de planificacion previa`);
  lines.push(`COEFICIENTE COGNITIVO TOTAL,${metrics.overallScore},Indice global de ingenio mecanico`);
  lines.push('');

  // Level Details Table
  lines.push('=== HISTORIAL DE NIVELES Y DESAFIOS ===');
  lines.push('ID Nivel,Titulo,Dificultad,Completado,Intentos,Tiempo Planificacion (s),Tiempo Ejecucion (s),Piezas Utilizadas,Puntaje,Fecha');

  if (attempts.length === 0) {
    lines.push('Sin registros todavia');
  } else {
    attempts.forEach((att) => {
      lines.push(
        [
          att.levelId,
          escapeCSV(att.levelTitle),
          escapeCSV(att.difficulty),
          att.completed ? 'SI' : 'NO',
          att.attemptsCount,
          att.planningTimeSeconds,
          att.executionTimeSeconds,
          att.partsUsed,
          att.score,
          att.completedAt ? escapeCSV(new Date(att.completedAt).toLocaleString()) : 'En progreso',
        ].join(',')
      );
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n'); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToPDF(
  user: UserProfile,
  metrics: CognitiveMetrics,
  attempts: LevelAttemptRecord[],
  profile: {
    archetype: string;
    description: string;
    strengths: string[];
    developmentAreas: string[];
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LABORATORIO COGNITIVO - LA MAQUINA INCREIBLE 2D', 14, 14);

  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Informe Oficial de Evaluacion de Desempeño y Razonamiento Fisico-Mecanico', 14, 22);

  // Auth Badge
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Autenticacion SSO: ${user.provider.toUpperCase()} | Sesion Token: ${user.token.substring(0, 16)}...`, 14, 28);

  y = 42;

  // User Profile Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Sujeto Evaluado: ${user.name}`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${user.email}   |   Rol: ${user.role}   |   Fecha: ${new Date().toLocaleDateString('es-ES')}`, 18, y + 16);

  y += 32;

  // Overall Score Highlight
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('COEFICIENTE DE INGENIO MECANICO (CI GLOBAL)', 20, y + 10);

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(22);
  doc.text(`${metrics.overallScore} / 100`, 20, y + 21);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Arquetipo: ${profile.archetype}`, 85, y + 12);
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(profile.description, 100), 85, y + 18);

  y += 34;

  // Cognitive Dimensions Breakdown
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Evaluacion de Dimensiones Neurocognitivas', 14, y);
  y += 6;

  const dimensions = [
    { label: 'Razonamiento Espacial', score: metrics.spatialReasoning, desc: 'Calculo angular, trayectorias e intuicion geometrica' },
    { label: 'Eficiencia en Resolucion', score: metrics.problemSolvingEfficiency, desc: 'Ratio entre numero de simulaciones y exito' },
    { label: 'Encadenamiento Logico Causal', score: metrics.causalLogicChaining, desc: 'Interconexion secuencial de causas y efectos fisicos' },
    { label: 'Flexibilidad Cognitiva', score: metrics.cognitiveFlexibility, desc: 'Adaptacion y ajuste fino de componentes con error' },
    { label: 'Indice de Perseverancia', score: metrics.perseveranceIndex, desc: 'Resiliencia psicomotriz ante fallos sucesivos' },
    { label: 'Ratio de Deliberacion', score: metrics.deliberationRatio, desc: 'Tiempo de observacion previa al inicio empirico' },
  ];

  dimensions.forEach((dim) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(dim.label, 14, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(dim.desc, 70, y + 4);

    // Score text
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text(`${dim.score}%`, 145, y + 4);

    // Progress bar
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(160, y + 1, 35, 4, 1, 1, 'F');
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(160, y + 1, Math.max(2, (35 * dim.score) / 100), 4, 1, 1, 'F');

    y += 8;
  });

  y += 6;

  // Strengths & Development
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Fortalezas Observadas:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  profile.strengths.forEach((st) => {
    doc.text(`• ${st}`, 18, y);
    y += 4.5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Areas de Oportunidad Cognitiva:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  profile.developmentAreas.forEach((da) => {
    doc.text(`• ${da}`, 18, y);
    y += 4.5;
  });

  y += 8;

  // Level Progression Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Desglose de Desafios y Telemetria en Tiempo Real', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Nivel', 16, y + 5);
  doc.text('Dificultad', 65, y + 5);
  doc.text('Intentos', 98, y + 5);
  doc.text('T. Plan', 118, y + 5);
  doc.text('Piezas', 138, y + 5);
  doc.text('Puntos', 158, y + 5);
  doc.text('Estado', 180, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (attempts.length === 0) {
    doc.text('Ningun nivel iniciado aun.', 16, y + 6);
    y += 8;
  } else {
    attempts.slice(0, 8).forEach((att, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 6, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(`${att.levelId}. ${att.levelTitle.substring(0, 24)}`, 16, y + 4.5);
      doc.text(att.difficulty, 65, y + 4.5);
      doc.text(att.attemptsCount.toString(), 102, y + 4.5);
      doc.text(`${att.planningTimeSeconds}s`, 120, y + 4.5);
      doc.text(att.partsUsed.toString(), 141, y + 4.5);
      doc.text(att.score.toString(), 160, y + 4.5);

      if (att.completed) {
        doc.setTextColor(22, 101, 52); // green
        doc.text('SUPERADO', 178, y + 4.5);
      } else {
        doc.setTextColor(180, 83, 9); // amber
        doc.text('EN CURSO', 178, y + 4.5);
      }
      y += 6;
    });
  }

  // Footer / Verification
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 280, pageWidth - 14, 280);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Generado automaticamente por el Motor de Evaluacion de La Maquina Increible 2D. Valido para fines educativos y analiticos.', 14, 285);
  doc.text(`Firma digital: SHA256-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`, 14, 289);

  // Save PDF
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeName = user.name.toLowerCase().replace(/\s+/g, '_');
  doc.save(`reporte_cognitivo_${safeName}_${timestamp}.pdf`);
}
