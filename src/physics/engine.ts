import { GameItem, LevelGoal, MechanismType, Vector2D } from '../types';
import { soundEngine } from '../services/audio';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class PhysicsEngine {
  public items: GameItem[] = [];
  public initialSnapshot: GameItem[] = [];
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public simulationSpeed: number = 1;
  public particles: Particle[] = [];
  public currentGoal: LevelGoal | null = null;
  public isGoalAchieved: boolean = false;
  public onGoalAchievedCallback: (() => void) | null = null;

  private gravity: number = 0.38;
  private airFriction: number = 0.995;
  private bounds = { width: 800, height: 500 };

  constructor(width = 800, height = 500) {
    this.bounds = { width, height };
  }

  public setGoal(goal: LevelGoal | null, callback?: () => void) {
    this.currentGoal = goal;
    this.isGoalAchieved = false;
    if (callback) {
      this.onGoalAchievedCallback = callback;
    }
  }

  public loadItems(newItems: GameItem[]) {
    this.items = JSON.parse(JSON.stringify(newItems));
    this.initialSnapshot = JSON.parse(JSON.stringify(newItems));
    this.isRunning = false;
    this.isPaused = false;
    this.isGoalAchieved = false;
    this.particles = [];
  }

  public saveSnapshot() {
    this.initialSnapshot = JSON.parse(JSON.stringify(this.items));
  }

  public start() {
    if (!this.isRunning) {
      this.saveSnapshot();
      this.isRunning = true;
      this.isPaused = false;
      this.isGoalAchieved = false;
    } else if (this.isPaused) {
      this.isPaused = false;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.isGoalAchieved = false;
    this.particles = [];
    this.items = JSON.parse(JSON.stringify(this.initialSnapshot));
  }

  public update(): boolean {
    if (!this.isRunning || this.isPaused) {
      return this.isGoalAchieved;
    }

    const steps = this.simulationSpeed === 2 ? 2 : 1;
    for (let s = 0; s < steps; s++) {
      this.subStep();
      if (this.checkGoalCondition()) {
        if (!this.isGoalAchieved) {
          this.isGoalAchieved = true;
          soundEngine.playWinFanfare();
          if (this.onGoalAchievedCallback) {
            this.onGoalAchievedCallback();
          }
        }
        break;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    return this.isGoalAchieved;
  }

  private subStep() {
    // 1. Update dynamic active objects (fans, conveyor belts, rockets, seesaws)
    this.items.forEach((item) => {
      // Fan wind field
      if ((item.type === 'fan_right' || item.type === 'fan_left') && item.isActive !== false) {
        const direction = item.type === 'fan_right' ? 1 : -1;
        const fanReach = 200;
        const fanHeight = item.height;

        // Emit subtle wind particle
        if (Math.random() < 0.25) {
          this.particles.push({
            x: item.x + (direction > 0 ? item.width / 2 : -item.width / 2),
            y: item.y + (Math.random() - 0.5) * (fanHeight * 0.8),
            vx: direction * (3 + Math.random() * 2),
            vy: (Math.random() - 0.5) * 0.4,
            life: 0,
            maxLife: 30,
            color: 'rgba(255, 255, 255, 0.4)',
            size: 2,
          });
        }

        // Apply wind force to all movable items in cone
        this.items.forEach((other) => {
          if (other.isStatic) return;
          const dx = other.x - item.x;
          const dy = Math.abs(other.y - item.y);
          if (dy < fanHeight * 0.7 && dx * direction > 0 && Math.abs(dx) < fanReach) {
            const force = (1 - Math.abs(dx) / fanReach) * 0.45;
            // Balloons are lighter and pushed harder
            const mult = other.type === 'balloon' ? 1.8 : other.type === 'tennis_ball' ? 1.2 : 0.4;
            other.vx += direction * force * mult;
          }
        });
      }

      // Rocket burning & launching
      if (item.type === 'rocket' && item.stateData?.isIgnited) {
        item.isStatic = false;
        item.vy -= 0.65; // powerful thrust
        item.vx += (Math.random() - 0.5) * 0.2;

        // Thrust particles
        for (let k = 0; k < 2; k++) {
          this.particles.push({
            x: item.x + (Math.random() - 0.5) * 6,
            y: item.y + item.height / 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 2 + Math.random() * 3,
            life: 0,
            maxLife: 20,
            color: Math.random() > 0.4 ? '#f97316' : '#facc15',
            size: 3 + Math.random() * 2,
          });
        }
      }

      // Gears continuous rotation
      if (item.type === 'gear') {
        item.angularVelocity = item.angularVelocity || 3;
        item.rotation = (item.rotation + item.angularVelocity) % 360;
      }

      // Boxing glove punch animation
      if (item.type === 'boxing_glove' && item.stateData?.isPunching) {
        const punchProgress = item.stateData.punchProgress || 0;
        if (punchProgress < 1) {
          item.stateData.punchProgress = punchProgress + 0.15;
        } else {
          item.stateData.isPunching = false;
        }
      }
    });

    // 2. Physics motion for non-static items (balls, balloon, rocket)
    this.items.forEach((item) => {
      if (item.isStatic) return;

      // Gravity vs Buoyancy
      if (item.type === 'balloon') {
        item.vy -= 0.22; // buoyant upwards lift
        item.vx *= 0.97;
        item.vy = Math.max(-3.5, item.vy * 0.98);
      } else {
        item.vy += this.gravity;
        item.vx *= this.airFriction;
        item.vy *= this.airFriction;
      }

      item.x += item.vx;
      item.y += item.vy;

      // Rotation based on movement
      if (item.radius) {
        item.rotation += item.vx * 3;
      }

      // Bounds collision (floor, walls, ceiling)
      const r = item.radius || Math.min(item.width, item.height) / 2;
      // Floor
      if (item.y + r > this.bounds.height - 10) {
        item.y = this.bounds.height - 10 - r;
        const restitution = item.type === 'tennis_ball' ? 0.8 : item.type === 'bowling_ball' ? 0.25 : 0.4;
        item.vy = -item.vy * restitution;
        item.vx *= 0.85; // floor friction
        if (Math.abs(item.vy) > 1.2) {
          soundEngine.playBounce(item.type === 'bowling_ball' ? 0.6 : 1.2);
        }
      }
      // Ceiling
      if (item.y - r < 10) {
        item.y = 10 + r;
        item.vy = Math.abs(item.vy) * 0.5;
      }
      // Left Wall
      if (item.x - r < 10) {
        item.x = 10 + r;
        item.vx = Math.abs(item.vx) * 0.7;
      }
      // Right Wall
      if (item.x + r > this.bounds.width - 10) {
        item.x = this.bounds.width - 10 - r;
        item.vx = -Math.abs(item.vx) * 0.7;
      }
    });

    // 3. Pairwise Collisions and Interactions
    for (let i = 0; i < this.items.length; i++) {
      for (let j = 0; j < this.items.length; j++) {
        if (i === j) continue;
        const a = this.items[i];
        const b = this.items[j];
        this.resolveInteraction(a, b);
      }
    }
  }

  private resolveInteraction(a: GameItem, b: GameItem) {
    // Only resolve if 'a' is a moving body or special active mechanism
    if (!a.radius && a.type !== 'rocket' && a.type !== 'balloon') return;

    const rA = a.radius || Math.min(a.width, a.height) / 2;

    // Interaction 1: Ball vs Trampoline
    if (b.type === 'trampoline') {
      const padTop = b.y - b.height / 2;
      const padLeft = b.x - b.width / 2;
      const padRight = b.x + b.width / 2;

      if (
        a.x >= padLeft - 6 &&
        a.x <= padRight + 6 &&
        a.y + rA >= padTop - 5 &&
        a.y + rA <= padTop + 16 &&
        a.vy > 0
      ) {
        a.y = padTop - rA;
        const trampolineBoost = a.type === 'tennis_ball' ? 1.45 : 1.1;
        a.vy = -Math.max(9, Math.abs(a.vy) * trampolineBoost);
        soundEngine.playSpring();
        b.stateData = { isFlexing: true, flexTime: Date.now() };

        // bounce sparkles
        for (let k = 0; k < 4; k++) {
          this.particles.push({
            x: a.x + (Math.random() - 0.5) * 16,
            y: padTop,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 3,
            life: 0,
            maxLife: 15,
            color: '#38bdf8',
            size: 2.5,
          });
        }
      }
    }

    // Interaction 2: Ball vs Conveyor Belt
    if (b.type === 'conveyor_right' || b.type === 'conveyor_left') {
      const topY = b.y - b.height / 2;
      const leftX = b.x - b.width / 2;
      const rightX = b.x + b.width / 2;

      if (
        a.x >= leftX &&
        a.x <= rightX &&
        a.y + rA >= topY - 4 &&
        a.y + rA <= topY + 12
      ) {
        a.y = topY - rA;
        a.vy = 0;
        const beltSpeed = b.type === 'conveyor_right' ? 3.8 : -3.8;
        a.vx = beltSpeed;
      }
    }

    // Interaction 3: Ball vs Ramp (Sloped plane)
    if (b.type === 'ramp_right' || b.type === 'ramp_left') {
      const leftX = b.x - b.width / 2;
      const rightX = b.x + b.width / 2;
      const bottomY = b.y + b.height / 2;
      const topY = b.y - b.height / 2;

      if (a.x >= leftX && a.x <= rightX && a.y + rA >= topY && a.y - rA <= bottomY) {
        const t = (a.x - leftX) / b.width; // 0 to 1
        // ramp_right: slopes downwards from top-left to bottom-right
        // ramp_left: slopes downwards from top-right to bottom-left
        const surfaceY = b.type === 'ramp_right'
          ? topY + t * b.height
          : bottomY - t * b.height;

        if (a.y + rA >= surfaceY - 6 && a.y + rA <= surfaceY + 14) {
          a.y = surfaceY - rA;
          const slopeNormal = b.type === 'ramp_right' ? 1 : -1;
          // accelerate down the ramp
          a.vx += slopeNormal * 0.42;
          a.vy = Math.abs(a.vx) * 0.55;
        }
      }
    }

    // Interaction 4: Ball vs Seesaw (Teeter-totter)
    if (b.type === 'seesaw') {
      const pivotX = b.x;
      const pivotY = b.y;
      const armLength = b.width / 2;
      const currentAngle = b.stateData?.angle || 0; // in degrees (-25 to 25)

      const dx = a.x - pivotX;
      if (Math.abs(dx) < armLength + 5) {
        // Calculate arm surface height at dx
        const rad = (currentAngle * Math.PI) / 180;
        const surfaceY = pivotY + dx * Math.tan(rad);

        if (a.y + rA >= surfaceY - 8 && a.y + rA <= surfaceY + 16) {
          a.y = surfaceY - rA;
          // Apply torque based on ball mass
          const mass = a.type === 'bowling_ball' ? 4 : 1;
          const torque = (dx / armLength) * mass * 3.5;

          let newAngle = Math.max(-25, Math.min(25, currentAngle + torque));
          b.stateData = { ...b.stateData, angle: newAngle };

          // If heavy bowling ball slams one side, catapult anything on the other side!
          if (a.vy > 2 && a.type === 'bowling_ball') {
            soundEngine.playBounce(0.5);
            // Launch other objects near opposite arm
            this.items.forEach((c) => {
              if (c !== a && !c.isStatic) {
                const cDx = c.x - pivotX;
                if (Math.sign(cDx) !== Math.sign(dx) && Math.abs(cDx) > 20) {
                  c.vy = -11;
                  c.vx = Math.sign(cDx) * 3;
                  soundEngine.playSpring();
                }
              }
            });
          }
          a.vy = 0;
          a.vx += (newAngle / 25) * 0.3;
        }
      }
    }

    // Interaction 5: Ball vs Pressure Switch Pad
    if (b.type === 'switch_pad') {
      const padTop = b.y - b.height / 2;
      const padLeft = b.x - b.width / 2;
      const padRight = b.x + b.width / 2;

      if (
        a.x >= padLeft &&
        a.x <= padRight &&
        a.y + rA >= padTop - 4 &&
        a.y + rA <= padTop + 14
      ) {
        if (!b.stateData?.isPressed) {
          b.stateData = { isPressed: true, pressTime: Date.now() };
          soundEngine.playSwitch();
          // Activate any connected mechanisms in the level
          this.items.forEach((targetItem) => {
            if (targetItem.type === 'fan_right' || targetItem.type === 'fan_left') {
              targetItem.isActive = !targetItem.isActive;
            }
            if (targetItem.type === 'boxing_glove') {
              targetItem.stateData = { isPunching: true, punchProgress: 0 };
              soundEngine.playSpring();
            }
          });
        }
      }
    }

    // Interaction 6: Ball vs Boxing Glove (Trigger punch or strike)
    if (b.type === 'boxing_glove' && b.stateData?.isPunching) {
      const punchDir = (b.rotation || 0) === 180 ? -1 : 1;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < rA + 36) {
        a.vx = punchDir * 14;
        a.vy = -5;
        soundEngine.playBounce(1.5);
      }
    }

    // Interaction 7: Rocket ignition by Candle flame
    if (a.type === 'rocket' && b.type === 'candle') {
      const flameX = b.x;
      const flameY = b.y - b.height / 2 - 4;
      const dist = Math.hypot(a.x - flameX, a.y - flameY);
      if (dist < 32 && !a.stateData?.isIgnited) {
        a.stateData = { isIgnited: true };
        soundEngine.playRocketLaunch();
      }
    }

    // Interaction 8: Balloon pops on Candle flame or Pin
    if (a.type === 'balloon') {
      if (b.type === 'candle' || b.type === 'balloon_target_pin') {
        const pinX = b.x;
        const pinY = b.y;
        if (Math.hypot(a.x - pinX, a.y - pinY) < rA + 15) {
          a.stateData = { isPopped: true };
          soundEngine.playBounce(2);
          // Pop particles
          for (let k = 0; k < 12; k++) {
            this.particles.push({
              x: a.x,
              y: a.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 0,
              maxLife: 25,
              color: '#f43f5e',
              size: 3,
            });
          }
          // Remove balloon from items
          this.items = this.items.filter((it) => it !== a);
        }
      }
    }

    // Interaction 9: Ball vs Bell Target (rings bell!)
    if (b.type === 'bell_target') {
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < rA + b.width / 2 && Math.hypot(a.vx, a.vy) > 0.6) {
        if (!b.stateData?.hasRung) {
          b.stateData = { hasRung: true, ringTime: Date.now() };
          soundEngine.playBell();
          for (let k = 0; k < 6; k++) {
            this.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 4,
              life: 0,
              maxLife: 20,
              color: '#fbbf24',
              size: 3,
            });
          }
        }
      }
    }

    // Interaction 10: Ball-to-Ball collision (momentum transfer)
    if (b.radius && !b.isStatic) {
      const rB = b.radius;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      if (dist < rA + rB && dist > 0.001) {
        const overlap = rA + rB - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Separate bodies
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        // Elastic momentum transfer based on mass
        const massA = a.type === 'bowling_ball' ? 4 : 1;
        const massB = b.type === 'bowling_ball' ? 4 : 1;

        const kx = a.vx - b.vx;
        const ky = a.vy - b.vy;
        const p = 2 * (nx * kx + ny * ky) / (massA + massB);

        a.vx -= p * massB * nx * 0.9;
        a.vy -= p * massB * ny * 0.9;
        b.vx += p * massA * nx * 0.9;
        b.vy += p * massA * ny * 0.9;

        if (Math.abs(p) > 0.8) {
          soundEngine.playBounce(1);
        }
      }
    }
  }

  private checkGoalCondition(): boolean {
    if (!this.currentGoal) return false;

    switch (this.currentGoal.targetType) {
      case 'ring_bell': {
        const bell = this.items.find((i) => i.id === this.currentGoal?.targetItemId || i.type === 'bell_target');
        return Boolean(bell?.stateData?.hasRung);
      }
      case 'ball_in_basket': {
        const basket = this.items.find((i) => i.id === this.currentGoal?.targetItemId || i.type === 'basket_target');
        if (!basket) return false;
        // Check if any ball is inside basket bounds
        const inside = this.items.some((it) => {
          if (!it.radius || it.isStatic) return false;
          const inX = Math.abs(it.x - basket.x) < basket.width * 0.45;
          const inY = it.y > basket.y - basket.height * 0.2 && it.y < basket.y + basket.height * 0.5;
          return inX && inY && Math.abs(it.vx) < 2.5 && Math.abs(it.vy) < 2.5;
        });
        return inside;
      }
      case 'launch_rocket': {
        const rocket = this.items.find((i) => i.id === this.currentGoal?.targetItemId || i.type === 'rocket');
        return Boolean(rocket?.stateData?.isIgnited && rocket.y < 80);
      }
      case 'pop_balloon': {
        // Goal achieved if target balloon has been popped
        const balloonStillExists = this.items.some((i) => i.type === 'balloon');
        return !balloonStillExists;
      }
      case 'activate_switch': {
        const sw = this.items.find((i) => i.id === this.currentGoal?.targetItemId || i.type === 'switch_pad');
        return Boolean(sw?.stateData?.isPressed);
      }
      default:
        return false;
    }
  }
}
