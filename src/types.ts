export type MechanismType =
  | 'bowling_ball'
  | 'tennis_ball'
  | 'balloon'
  | 'ramp_right'
  | 'ramp_left'
  | 'trampoline'
  | 'seesaw'
  | 'gear'
  | 'conveyor_right'
  | 'conveyor_left'
  | 'fan_right'
  | 'fan_left'
  | 'candle'
  | 'rocket'
  | 'switch_pad'
  | 'boxing_glove'
  | 'bell_target'
  | 'basket_target'
  | 'balloon_target_pin';

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameItem {
  id: string;
  type: MechanismType;
  x: number; // grid or canvas coordinates
  y: number;
  vx: number;
  vy: number;
  rotation: number; // in degrees
  width: number;
  height: number;
  radius?: number;
  isStatic: boolean; // cannot be moved by physics (e.g., ramps, targets, fixed walls)
  isFixedInLevel?: boolean; // provided as level obstacle/setup, cannot be dragged by player
  isActive?: boolean; // for activated mechanisms (fans on, switch pressed, rocket fired)
  angularVelocity?: number;
  stateData?: Record<string, any>; // custom state like fuseRemaining, seesawAngle, etc.
}

export interface ToolboxItemDefinition {
  type: MechanismType;
  name: string;
  category: 'proyectiles' | 'propulsion' | 'transmision' | 'estructuras' | 'logica';
  description: string;
  icon: string;
  width: number;
  height: number;
  radius?: number;
}

export interface LevelGoal {
  description: string;
  targetType: 'ring_bell' | 'ball_in_basket' | 'launch_rocket' | 'pop_balloon' | 'activate_switch';
  targetItemId: string;
  completedText: string;
}

export interface LevelDefinition {
  id: number;
  title: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Experto' | 'Maestro' | 'Sandbox';
  difficultyRank: number; // 1 to 5
  briefing: string;
  goal: LevelGoal;
  fixedItems: Omit<GameItem, 'id' | 'vx' | 'vy'>[];
  availableInventory: { type: MechanismType; count: number }[];
  hint: string;
}

export interface CognitiveMetrics {
  spatialReasoning: number; // 0-100: precision, angles, distances
  problemSolvingEfficiency: number; // 0-100: trials vs success, time
  causalLogicChaining: number; // 0-100: length of mechanism sequence
  cognitiveFlexibility: number; // 0-100: tweaking vs restarting, varied mechanisms
  perseveranceIndex: number; // 0-100: resilience after simulation failures
  deliberationRatio: number; // 0-100: planning time before hitting run
  overallScore: number;
}

export interface TelemetryEvent {
  timestamp: number;
  action: 'part_added' | 'part_moved' | 'part_rotated' | 'part_removed' | 'sim_started' | 'sim_failed' | 'sim_reset' | 'level_completed';
  levelId: number;
  details?: Record<string, any>;
}

export interface LevelAttemptRecord {
  levelId: number;
  levelTitle: string;
  difficulty: string;
  attemptsCount: number;
  planningTimeSeconds: number;
  executionTimeSeconds: number;
  partsUsed: number;
  completed: boolean;
  completedAt?: string;
  score: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  provider: 'google' | 'github' | 'institutional' | 'guest';
  role: 'Ingeniero Mecánico' | 'Investigador Cognitivo' | 'Estudiante' | 'Explorador';
  createdAt: string;
  token: string;
}
