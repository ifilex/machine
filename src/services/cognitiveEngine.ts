import { CognitiveMetrics, LevelAttemptRecord, TelemetryEvent } from '../types';

const STORAGE_METRICS_KEY = 'tim_cognitive_history';

export class CognitiveEngine {
  private events: TelemetryEvent[] = [];
  private levelAttempts: Map<number, LevelAttemptRecord> = new Map();
  private levelStartTime: number = Date.now();
  private firstSimStartTime: number | null = null;
  private currentLevelAttemptsCount: number = 0;
  private listeners: ((metrics: CognitiveMetrics) => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const saved = localStorage.getItem(STORAGE_METRICS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.events) this.events = parsed.events;
        if (parsed.attempts) {
          this.levelAttempts = new Map(Object.entries(parsed.attempts).map(([k, v]) => [Number(k), v as LevelAttemptRecord]));
        }
      } catch (e) {
        console.error('Error loading cognitive metrics state', e);
      }
    }
  }

  private saveState() {
    try {
      const attemptsObj: Record<number, LevelAttemptRecord> = {};
      this.levelAttempts.forEach((v, k) => {
        attemptsObj[k] = v;
      });
      localStorage.setItem(
        STORAGE_METRICS_KEY,
        JSON.stringify({
          events: this.events.slice(-500), // keep latest 500
          attempts: attemptsObj,
        })
      );
    } catch (e) {
      console.warn('Could not save cognitive state to localStorage', e);
    }
  }

  public subscribe(callback: (metrics: CognitiveMetrics) => void): () => void {
    this.listeners.push(callback);
    callback(this.calculateMetrics());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    const metrics = this.calculateMetrics();
    this.listeners.forEach((cb) => cb(metrics));
  }

  public startLevel(levelId: number, levelTitle: string, difficulty: string) {
    this.levelStartTime = Date.now();
    this.firstSimStartTime = null;
    this.currentLevelAttemptsCount = 0;

    if (!this.levelAttempts.has(levelId)) {
      this.levelAttempts.set(levelId, {
        levelId,
        levelTitle,
        difficulty,
        attemptsCount: 0,
        planningTimeSeconds: 0,
        executionTimeSeconds: 0,
        partsUsed: 0,
        completed: false,
        score: 0,
      });
    }
    this.saveState();
    this.notify();
  }

  public logEvent(
    action: TelemetryEvent['action'],
    levelId: number,
    details?: Record<string, any>
  ) {
    const event: TelemetryEvent = {
      timestamp: Date.now(),
      action,
      levelId,
      details,
    };
    this.events.push(event);

    const record = this.levelAttempts.get(levelId);

    if (action === 'sim_started') {
      this.currentLevelAttemptsCount++;
      if (this.firstSimStartTime === null) {
        this.firstSimStartTime = Date.now();
      }
      if (record) {
        record.attemptsCount = Math.max(record.attemptsCount, this.currentLevelAttemptsCount);
        record.planningTimeSeconds = Math.round((this.firstSimStartTime - this.levelStartTime) / 1000);
      }
    }

    if (action === 'level_completed' && record) {
      record.completed = true;
      record.completedAt = new Date().toISOString();
      const totalElapsed = Math.round((Date.now() - this.levelStartTime) / 1000);
      record.executionTimeSeconds = totalElapsed;
      if (details?.partsCount !== undefined) {
        record.partsUsed = details.partsCount;
      }
      // Calculate level score: based on efficiency, speed and attempts
      const basePoints = 1000;
      const attemptPenalty = Math.max(0, (record.attemptsCount - 1) * 60);
      const timePenalty = Math.min(300, totalElapsed * 2);
      record.score = Math.max(250, basePoints - attemptPenalty - timePenalty + (details?.chainLength || 1) * 80);
    }

    this.saveState();
    this.notify();
  }

  public calculateMetrics(): CognitiveMetrics {
    const records = Array.from(this.levelAttempts.values());
    const completedRecords = records.filter((r) => r.completed);

    // 1. Spatial Reasoning: Based on precision, rotation changes and successful geometric setups
    let rotationEvents = this.events.filter((e) => e.action === 'part_rotated').length;
    let moveEvents = this.events.filter((e) => e.action === 'part_moved').length;
    let spatialBase = 65;
    if (completedRecords.length > 0) {
      spatialBase += Math.min(25, completedRecords.length * 4);
    }
    // Reward deliberate rotations and fine-tuning adjustments
    const spatialScore = Math.min(98, Math.max(45, Math.round(spatialBase + Math.min(10, rotationEvents * 1.5))));

    // 2. Problem-Solving Efficiency: Ratio of attempts to completion
    let avgAttempts = 1;
    if (completedRecords.length > 0) {
      const totalAttempts = completedRecords.reduce((acc, r) => acc + r.attemptsCount, 0);
      avgAttempts = totalAttempts / completedRecords.length;
    }
    // If avgAttempts <= 1.5 -> 90+, if avgAttempts >= 5 -> 60
    const efficiencyScore = Math.min(99, Math.max(40, Math.round(100 - (avgAttempts - 1) * 9)));

    // 3. Causal Logic Chaining: Mechanisms chained in completed levels
    const maxChain = Math.max(2, ...completedRecords.map((r) => r.partsUsed || 2));
    const logicScore = Math.min(98, Math.max(50, Math.round(55 + completedRecords.length * 5 + maxChain * 3)));

    // 4. Cognitive Flexibility: Modifying individual parts vs resetting completely
    const modifications = this.events.filter((e) => e.action === 'part_moved' || e.action === 'part_rotated').length;
    const resets = this.events.filter((e) => e.action === 'sim_reset').length;
    const flexRatio = resets > 0 ? modifications / resets : 2;
    const flexibilityScore = Math.min(96, Math.max(50, Math.round(60 + Math.min(30, flexRatio * 8))));

    // 5. Perseverance Index: Resilience through failed simulations
    const failures = this.events.filter((e) => e.action === 'sim_failed').length;
    let perseveranceScore = 70;
    if (failures > 0) {
      perseveranceScore = Math.min(99, 70 + Math.min(25, failures * 3));
    }
    if (completedRecords.length > 0) {
      perseveranceScore = Math.min(99, perseveranceScore + completedRecords.length * 3);
    }

    // 6. Deliberation Ratio: Time spent planning prior to first simulation
    let avgPlanning = 8;
    if (records.length > 0) {
      const totalPlanning = records.reduce((acc, r) => acc + (r.planningTimeSeconds || 5), 0);
      avgPlanning = totalPlanning / records.length;
    }
    const deliberationScore = Math.min(96, Math.max(45, Math.round(50 + Math.min(45, avgPlanning * 3.5))));

    // Overall Aggregate Score
    const overall = Math.round(
      spatialScore * 0.2 +
        efficiencyScore * 0.2 +
        logicScore * 0.2 +
        flexibilityScore * 0.15 +
        perseveranceScore * 0.15 +
        deliberationScore * 0.1
    );

    return {
      spatialReasoning: spatialScore,
      problemSolvingEfficiency: efficiencyScore,
      causalLogicChaining: logicScore,
      cognitiveFlexibility: flexibilityScore,
      perseveranceIndex: perseveranceScore,
      deliberationRatio: deliberationScore,
      overallScore: overall,
    };
  }

  public getCognitiveProfile(): {
    archetype: string;
    description: string;
    strengths: string[];
    developmentAreas: string[];
  } {
    const metrics = this.calculateMetrics();

    let archetype = 'Ingeniero Empírico Adaptativo';
    let description =
      'Demuestra un enfoque equilibrado entre intuición física y ensayo deliberado, adaptando mecanismos mediante ajuste fino.';

    if (metrics.deliberationRatio > 75 && metrics.problemSolvingEfficiency > 80) {
      archetype = 'Arquitecto Estratégico Causal';
      description =
        'Analiza las leyes mecánicas exhaustivamente antes de accionar la simulación, minimizando el error mediante alta precisión predictiva.';
    } else if (metrics.causalLogicChaining > 80) {
      archetype = 'Maestro de Reacciones en Cadena';
      description =
        'Excelente comprensión de la transferencia de energía cinética y acoplamientos mecánicos complejos.';
    } else if (metrics.perseveranceIndex > 85) {
      archetype = 'Ingeniero Resiliente de Alta Tenacidad';
      description =
        'Extraordinaria resistencia a la frustración; convierte cada fallo de trayectoria en una hipótesis de mejora.';
    }

    const strengths: string[] = [];
    if (metrics.spatialReasoning >= 75) strengths.push('Estimación de trayectorias balísticas y vectores angulares');
    if (metrics.causalLogicChaining >= 75) strengths.push('Interconexión secuencial de causas y efectos físicos');
    if (metrics.problemSolvingEfficiency >= 75) strengths.push('Resolución óptima con mínima redundancia de intentos');
    if (metrics.perseveranceIndex >= 75) strengths.push('Alta perseverancia y calibración empírica ante fallos');
    if (strengths.length === 0) strengths.push('Comprensión progresiva de interacción mecánica');

    const developmentAreas: string[] = [];
    if (metrics.deliberationRatio < 65) developmentAreas.push('Invertir más tiempo en análisis visual previo al inicio');
    if (metrics.cognitiveFlexibility < 65) developmentAreas.push('Experimentar con combinaciones de piezas no convencionales');
    if (metrics.problemSolvingEfficiency < 65) developmentAreas.push('Reducir la dependencia de prueba y error apresurada');
    if (developmentAreas.length === 0) developmentAreas.push('Mantener el rigor analítico en desafíos de lógica combinatoria');

    return { archetype, description, strengths, developmentAreas };
  }

  public getAllAttempts(): LevelAttemptRecord[] {
    return Array.from(this.levelAttempts.values());
  }

  public getRecentEvents(): TelemetryEvent[] {
    return this.events.slice(-60).reverse();
  }

  public resetAllData() {
    this.events = [];
    this.levelAttempts.clear();
    localStorage.removeItem(STORAGE_METRICS_KEY);
    this.notify();
  }
}

export const cognitiveEngine = new CognitiveEngine();
