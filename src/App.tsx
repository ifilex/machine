import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem, MechanismType, LevelDefinition, UserProfile, CognitiveMetrics } from './types';
import { GAME_LEVELS, TOOLBOX_CATALOG } from './data/levels';
import { PhysicsEngine } from './physics/engine';
import { cognitiveEngine } from './services/cognitiveEngine';
import { authService } from './services/authService';
import { soundEngine } from './services/audio';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { Toolbox } from './components/Toolbox';
import { ControlBar } from './components/ControlBar';
import { CognitiveDashboardModal } from './components/CognitiveDashboardModal';
import { AuthModal } from './components/AuthModal';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  // State: Current level & user profile
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const currentLevel = GAME_LEVELS.find((l) => l.id === currentLevelId) || GAME_LEVELS[0];

  const [user, setUser] = useState<UserProfile>(authService.getCurrentUser());
  const [metrics, setMetrics] = useState<CognitiveMetrics>(cognitiveEngine.calculateMetrics());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.isMuted());

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);

  // Toolbox & Canvas Interaction
  const [availableInventory, setAvailableInventory] = useState<{ type: MechanismType; count: number }[]>([]);
  const [selectedTool, setSelectedTool] = useState<MechanismType | null>(null);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  // Simulation controls state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [levelAttemptsCount, setLevelAttemptsCount] = useState<number>(0);
  const attemptsCountRef = useRef<number>(0);

  // Physics Engine Instance
  const physicsRef = useRef<PhysicsEngine>(new PhysicsEngine(800, 500));
  const physics = physicsRef.current;

  // Initialize level
  const loadLevel = useCallback(
    (level: LevelDefinition) => {
      physics.reset();
      setIsRunning(false);
      setIsPaused(false);
      setSelectedItem(null);
      setSelectedTool(null);
      setLevelAttemptsCount(0);
      attemptsCountRef.current = 0;

      // Deep copy fixed items
      const initialItems: GameItem[] = level.fixedItems.map((fi, idx) => ({
        ...fi,
        id: `fixed_${level.id}_${idx}_${fi.type}`,
        vx: 0,
        vy: 0,
        stateData: {},
      }));

      physics.loadItems(initialItems);
      setAvailableInventory(JSON.parse(JSON.stringify(level.availableInventory)));

      // Set level goal and victory callback
      physics.setGoal(level.goal, () => {
        setIsVictoryOpen(true);
        const playerPlacedParts = physics.items.filter((it) => !it.isFixedInLevel).length;
        cognitiveEngine.logEvent('level_completed', level.id, {
          partsCount: playerPlacedParts,
          attempts: attemptsCountRef.current + 1,
        });
      });

      // Notify cognitive engine of new level
      cognitiveEngine.startLevel(level.id, level.title, level.difficulty);
    },
    [physics]
  );

  // Handle Level Switch
  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevelId, loadLevel]);

  // Subscribe to Auth and Cognitive updates
  useEffect(() => {
    const unsubAuth = authService.subscribe((u) => setUser(u));
    const unsubCognitive = cognitiveEngine.subscribe((m) => setMetrics(m));
    return () => {
      unsubAuth();
      unsubCognitive();
    };
  }, []);

  // Physics update frame loop
  useEffect(() => {
    let animationId: number;

    const tick = () => {
      if (physics.isRunning && !physics.isPaused) {
        physics.update();
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [physics]);

  // Simulation handlers
  const handleStartSimulation = () => {
    attemptsCountRef.current += 1;
    setLevelAttemptsCount((prev) => prev + 1);
    setSelectedItem(null);
    physics.start();
    setIsRunning(true);
    setIsPaused(false);
    cognitiveEngine.logEvent('sim_started', currentLevel.id, {
      partsOnBoard: physics.items.length,
    });
  };

  const handlePauseSimulation = () => {
    physics.pause();
    setIsPaused(true);
  };

  const handleResetSimulation = () => {
    physics.reset();
    setIsRunning(false);
    setIsPaused(false);
    setSelectedItem(null);
    cognitiveEngine.logEvent('sim_reset', currentLevel.id);
  };

  const handleRestartLevel = () => {
    loadLevel(currentLevel);
  };

  const handleToggleSpeed = () => {
    const nextSpeed = simulationSpeed === 1 ? 2 : 1;
    setSimulationSpeed(nextSpeed);
    physics.simulationSpeed = nextSpeed;
  };

  const handleStepSimulation = () => {
    if (physics.isRunning) {
      physics.update();
    }
  };

  // Spawning an item from inventory to canvas
  const handleSpawnItem = (type: MechanismType) => {
    const invIndex = availableInventory.findIndex((i) => i.type === type);
    if (invIndex === -1 || availableInventory[invIndex].count <= 0) return;

    // Deduct 1 from available inventory
    const nextInv = [...availableInventory];
    nextInv[invIndex] = { ...nextInv[invIndex], count: nextInv[invIndex].count - 1 };
    setAvailableInventory(nextInv);

    // Calculate spawn position near center or staggered
    const def = TOOLBOX_CATALOG[type];
    const offset = (physics.items.length % 5) * 20;
    const newItem: GameItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: 350 + offset,
      y: 240 + offset,
      vx: 0,
      vy: 0,
      rotation: 0,
      width: def?.width || 40,
      height: def?.height || 40,
      radius: def?.radius,
      isStatic: type !== 'bowling_ball' && type !== 'tennis_ball' && type !== 'balloon' && type !== 'rocket',
      isFixedInLevel: false,
      stateData: {},
    };

    physics.items.push(newItem);
    physics.saveSnapshot();
    setSelectedItem(newItem);

    cognitiveEngine.logEvent('part_added', currentLevel.id, {
      type,
      x: newItem.x,
      y: newItem.y,
    });
  };

  // Rotating the currently selected item
  const handleRotateSelected = () => {
    if (!selectedItem || selectedItem.isFixedInLevel) return;

    // For ramps and conveyors, toggle direction or 45/90 degrees
    let nextRotation = (selectedItem.rotation + 45) % 360;
    if (selectedItem.type === 'conveyor_right') {
      selectedItem.type = 'conveyor_left';
    } else if (selectedItem.type === 'conveyor_left') {
      selectedItem.type = 'conveyor_right';
    } else if (selectedItem.type === 'fan_right') {
      selectedItem.type = 'fan_left';
    } else if (selectedItem.type === 'fan_left') {
      selectedItem.type = 'fan_right';
    } else {
      selectedItem.rotation = nextRotation;
    }

    physics.saveSnapshot();
    setSelectedItem({ ...selectedItem });

    cognitiveEngine.logEvent('part_rotated', currentLevel.id, {
      id: selectedItem.id,
      rotation: selectedItem.rotation,
      type: selectedItem.type,
    });
  };

  // Removing selected item (returns to inventory)
  const handleRemoveSelected = () => {
    if (!selectedItem || selectedItem.isFixedInLevel) return;

    const itemType = selectedItem.type;
    physics.items = physics.items.filter((it) => it.id !== selectedItem.id);
    physics.saveSnapshot();

    // Return to inventory
    const baseType = itemType.startsWith('conveyor')
      ? 'conveyor_right'
      : itemType.startsWith('fan')
      ? 'fan_right'
      : itemType;

    const nextInv = [...availableInventory];
    const invIdx = nextInv.findIndex((i) => i.type === baseType || i.type === itemType);
    if (invIdx !== -1) {
      nextInv[invIdx] = { ...nextInv[invIdx], count: nextInv[invIdx].count + 1 };
    } else {
      nextInv.push({ type: itemType, count: 1 });
    }
    setAvailableInventory(nextInv);
    setSelectedItem(null);

    cognitiveEngine.logEvent('part_removed', currentLevel.id, { type: itemType });
  };

  // Item moved on canvas
  const handleItemMoved = (item: GameItem) => {
    cognitiveEngine.logEvent('part_moved', currentLevel.id, {
      id: item.id,
      x: item.x,
      y: item.y,
    });
  };

  // Next level navigation
  const handleNextLevel = () => {
    setIsVictoryOpen(false);
    const currentIndex = GAME_LEVELS.findIndex((l) => l.id === currentLevel.id);
    if (currentIndex < GAME_LEVELS.length - 1) {
      setCurrentLevelId(GAME_LEVELS[currentIndex + 1].id);
    }
  };

  return (
    <div
      id="tim-app-container"
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-['Outfit'] text-slate-100 select-none"
    >
      {/* 1. Header Bar */}
      <Header
        currentLevel={currentLevel}
        levels={GAME_LEVELS}
        onSelectLevel={(id) => setCurrentLevelId(id)}
        user={user}
        metrics={metrics}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(soundEngine.toggleMute())}
      />

      {/* 2. Main Stage Area (Canvas + Toolbox) */}
      <main className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
        {/* Interactive 2D Physics Canvas */}
        <GameCanvas
          physics={physics}
          selectedItem={selectedItem}
          onSelectItem={(item) => setSelectedItem(item)}
          onItemMoved={handleItemMoved}
        />

        {/* Adaptive Toolbox Drawer (Right on PC, Bottom on mobile) */}
        <Toolbox
          availableInventory={availableInventory}
          selectedTool={selectedTool}
          onSelectTool={(tool) => setSelectedTool(tool)}
          onSpawnItem={handleSpawnItem}
        />
      </main>

      {/* 3. Bottom Control & Simulation Bar */}
      <ControlBar
        currentLevel={currentLevel}
        isRunning={isRunning}
        isPaused={isPaused}
        simulationSpeed={simulationSpeed}
        selectedItem={selectedItem}
        onStart={handleStartSimulation}
        onPause={handlePauseSimulation}
        onReset={handleResetSimulation}
        onRestartLevel={handleRestartLevel}
        onToggleSpeed={handleToggleSpeed}
        onStep={handleStepSimulation}
        onRotateSelected={handleRotateSelected}
        onRemoveSelected={handleRemoveSelected}
        onDeselect={() => setSelectedItem(null)}
      />

      {/* 4. Cognitive Analytics Dashboard Modal (with CSV & PDF Export) */}
      <CognitiveDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        user={user}
        metrics={metrics}
        cognitiveEngine={cognitiveEngine}
      />

      {/* 5. SSO Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUserChange={(updated) => setUser(updated)}
      />

      {/* 6. Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        level={currentLevel}
        onNextLevel={handleNextLevel}
        onReplay={() => {
          setIsVictoryOpen(false);
          handleResetSimulation();
        }}
        onOpenDashboard={() => {
          setIsVictoryOpen(false);
          setIsDashboardOpen(true);
        }}
        attemptsCount={Math.max(1, levelAttemptsCount)}
      />
    </div>
  );
}
