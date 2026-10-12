import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameItem, MechanismType } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { soundEngine } from '../services/audio';

interface GameCanvasProps {
  physics: PhysicsEngine;
  selectedItem: GameItem | null;
  onSelectItem: (item: GameItem | null) => void;
  onItemMoved: (item: GameItem) => void;
}

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 500;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  physics,
  selectedItem,
  onSelectItem,
  onItemMoved,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [draggedItem, setDraggedItem] = useState<GameItem | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);

  // Convert client viewport coordinates to 800x500 virtual canvas coordinates
  const getVirtualCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        x: Math.max(15, Math.min(VIRTUAL_WIDTH - 15, rawX / scale)),
        y: Math.max(15, Math.min(VIRTUAL_HEIGHT - 15, rawY / scale)),
      };
    },
    [scale]
  );

  // Handle Resize & Aspect Ratio Fit
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const scaleX = containerWidth / VIRTUAL_WIDTH;
      const scaleY = containerHeight / VIRTUAL_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.35); // Cap to preserve crispness
      setScale(newScale);

      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = VIRTUAL_WIDTH * dpr;
      canvasRef.current.height = VIRTUAL_HEIGHT * dpr;
      canvasRef.current.style.width = `${VIRTUAL_WIDTH * newScale}px`;
      canvasRef.current.style.height = `${VIRTUAL_HEIGHT * newScale}px`;
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Main Render Loop (Draw blueprint and mechanisms)
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Blueprint Background
      ctx.fillStyle = '#0f172a'; // slate-900 base
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // Blueprint Technical Grid (major 50px, minor 10px)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < VIRTUAL_WIDTH; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, VIRTUAL_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < VIRTUAL_HEIGHT; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(VIRTUAL_WIDTH, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < VIRTUAL_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, VIRTUAL_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < VIRTUAL_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(VIRTUAL_WIDTH, y);
        ctx.stroke();
      }

      // Border bounds with blueprint ruler ticks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, VIRTUAL_WIDTH - 16, VIRTUAL_HEIGHT - 16);

      // Corner technical marks
      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.font = '9px monospace';
      ctx.fillText('TIM-2D // EXP-LAB', 14, 20);
      ctx.fillText('GRAV: 9.8 m/s²', VIRTUAL_WIDTH - 90, 20);

      // 2. Draw Particles (wind, fire sparks, smoke, confetti)
      physics.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Game Items
      physics.items.forEach((item) => {
        drawGameItem(ctx, item, item.id === selectedItem?.id);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [physics, selectedItem]);

  // Pointer / Touch Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getVirtualCoords(e.clientX, e.clientY);

    // Find clicked item (topmost first)
    const clickedItem = [...physics.items].reverse().find((item) => {
      const halfW = (item.width || 30) / 2 + 8;
      const halfH = (item.height || 30) / 2 + 8;
      return Math.abs(item.x - x) <= halfW && Math.abs(item.y - y) <= halfH;
    });

    if (clickedItem) {
      soundEngine.playClick();
      onSelectItem(clickedItem);

      if (!clickedItem.isFixedInLevel && !physics.isRunning) {
        setDraggedItem(clickedItem);
        setDragOffset({ x: clickedItem.x - x, y: clickedItem.y - y });
      }
    } else {
      onSelectItem(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedItem || physics.isRunning) return;
    const { x, y } = getVirtualCoords(e.clientX, e.clientY);

    let newX = Math.round((x + dragOffset.x) / 5) * 5; // gentle 5px snap
    let newY = Math.round((y + dragOffset.y) / 5) * 5;

    // Bounds limit
    const halfW = draggedItem.width / 2;
    const halfH = draggedItem.height / 2;
    newX = Math.max(halfW + 12, Math.min(VIRTUAL_WIDTH - halfW - 12, newX));
    newY = Math.max(halfH + 12, Math.min(VIRTUAL_HEIGHT - halfH - 12, newY));

    draggedItem.x = newX;
    draggedItem.y = newY;
    onItemMoved(draggedItem);
  };

  const handlePointerUp = () => {
    if (draggedItem) {
      setDraggedItem(null);
      physics.saveSnapshot();
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-wrapper"
      className="flex-1 w-full h-full min-h-[300px] flex items-center justify-center bg-slate-950 p-2 overflow-hidden touch-none relative select-none"
    >
      <canvas
        ref={canvasRef}
        id="physics-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="rounded-xl shadow-2xl border border-slate-800 cursor-crosshair active:cursor-grabbing block"
      />
    </div>
  );
};

// Procedural 2D Drawing Helper for authentic TIM mechanisms
function drawGameItem(ctx: CanvasRenderingContext2D, item: GameItem, isSelected: boolean) {
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.rotation) {
    ctx.rotate((item.rotation * Math.PI) / 180);
  }

  // Draw Selection Halo
  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    const pad = 6;
    ctx.strokeRect(
      -item.width / 2 - pad,
      -item.height / 2 - pad,
      item.width + pad * 2,
      item.height + pad * 2
    );
    ctx.setLineDash([]);
  }

  // Fixed in level indicator badge
  if (item.isFixedInLevel) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.beginPath();
    ctx.arc(item.width / 2 + 2, -item.height / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (item.type) {
    case 'tennis_ball': {
      const r = item.radius || 14;
      // Tennis felt
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#bef264');
      grad.addColorStop(1, '#65a30d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tennis seam curved line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      break;
    }

    case 'bowling_ball': {
      const r = item.radius || 18;
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#52525b');
      grad.addColorStop(0.7, '#18181b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // 3 finger grip holes
      ctx.fillStyle = '#000000';
      const holeR = 2.2;
      ctx.beginPath();
      ctx.arc(-r * 0.25, -r * 0.3, holeR, 0, Math.PI * 2);
      ctx.arc(r * 0.2, -r * 0.3, holeR, 0, Math.PI * 2);
      ctx.arc(0, r * 0.2, holeR, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'balloon': {
      const r = item.radius || 17;
      // Shiny red balloon
      const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.4, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, -2, r, r * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Knot and string
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-3, r * 1.25 - 2);
      ctx.lineTo(3, r * 1.25 - 2);
      ctx.lineTo(0, r * 1.25 + 3);
      ctx.fill();

      // Wavy string
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.25 + 3);
      ctx.quadraticCurveTo(-4, r * 1.25 + 12, 0, r * 1.25 + 20);
      ctx.stroke();
      break;
    }

    case 'ramp_right': {
      const w = item.width;
      const h = item.height;
      // Wood textured inclined plane
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wood plank stripes
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = 1;
      for (let i = -w / 2 + 15; i < w / 2; i += 18) {
        ctx.beginPath();
        ctx.moveTo(i, h / 2);
        ctx.lineTo(i, -h / 2 + ((i + w / 2) / w) * h);
        ctx.stroke();
      }
      break;
    }

    case 'ramp_left': {
      const w = item.width;
      const h = item.height;
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = 1;
      for (let i = -w / 2 + 15; i < w / 2; i += 18) {
        ctx.beginPath();
        ctx.moveTo(i, h / 2);
        ctx.lineTo(i, h / 2 - ((i + w / 2) / w) * h);
        ctx.stroke();
      }
      break;
    }

    case 'trampoline': {
      const w = item.width;
      const h = item.height;
      const isFlexing = item.stateData?.isFlexing && Date.now() - (item.stateData.flexTime || 0) < 180;
      const flexDip = isFlexing ? 6 : 0;

      // Elastic pad surface
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.quadraticCurveTo(0, -h / 2 + flexDip, w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2 + 6);
      ctx.quadraticCurveTo(0, -h / 2 + 6 + flexDip, -w / 2, -h / 2 + 6);
      ctx.closePath();
      ctx.fill();

      // Springs & metal legs
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 8, -h / 2 + 6);
      ctx.lineTo(-w / 2 + 3, h / 2);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(w / 2 - 8, -h / 2 + 6);
      ctx.lineTo(w / 2 - 3, h / 2);
      ctx.stroke();
      // Center V strut
      ctx.beginPath();
      ctx.moveTo(-10, -h / 2 + 6);
      ctx.lineTo(0, h / 2);
      ctx.lineTo(10, -h / 2 + 6);
      ctx.stroke();
      break;
    }

    case 'seesaw': {
      const w = item.width;
      const h = item.height;
      const angle = item.stateData?.angle || 0;

      // 1. Fulcrum (triangular base sitting below)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(-14, h / 2 + 6);
      ctx.lineTo(14, h / 2 + 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      // 2. Rotating Plank
      ctx.save();
      ctx.rotate((angle * Math.PI) / 180);
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-w / 2, -4, w, 8);
      ctx.strokeRect(-w / 2, -4, w, 8);

      // Center pivot bolt
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'gear': {
      const r = item.radius || 24;
      ctx.fillStyle = '#b45309'; // bronze/brass gear
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Cogs teeth
      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const a = (i * Math.PI * 2) / teeth;
        const tx = Math.cos(a) * (r + 4);
        const ty = Math.sin(a) * (r + 4);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner hub
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'conveyor_right':
    case 'conveyor_left': {
      const w = item.width;
      const h = item.height;
      const isRight = item.type === 'conveyor_right';

      // Frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2, -h / 2, w, h);

      // Rollers on ends
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-w / 2 + 10, 0, h / 2 - 3, 0, Math.PI * 2);
      ctx.arc(w / 2 - 10, 0, h / 2 - 3, 0, Math.PI * 2);
      ctx.fill();

      // Moving chevron belt texture
      ctx.fillStyle = '#10b981';
      const offset = (Date.now() / 40) % 20;
      const dir = isRight ? 1 : -1;
      for (let x = -w / 2 + 15; x < w / 2 - 15; x += 18) {
        const curX = x + dir * offset;
        if (curX > -w / 2 + 10 && curX < w / 2 - 10) {
          ctx.beginPath();
          ctx.moveTo(curX - 3 * dir, -3);
          ctx.lineTo(curX + 3 * dir, 0);
          ctx.lineTo(curX - 3 * dir, 3);
          ctx.stroke();
        }
      }
      break;
    }

    case 'fan_right':
    case 'fan_left': {
      const w = item.width;
      const h = item.height;
      const isRight = item.type === 'fan_right';

      // Fan Housing base
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w / 2, h / 2 - 8, w, 8);

      // Round protective grille
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, -4, h / 2 - 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Spinning blades
      const spin = Date.now() / 60;
      ctx.save();
      ctx.translate(0, -4);
      ctx.rotate(spin);
      ctx.fillStyle = '#f8fafc';
      for (let b = 0; b < 3; b++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.fillRect(-2.5, -h / 2 + 10, 5, h / 2 - 12);
      }
      ctx.restore();

      // Wind nozzle direction indicator
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      const nDir = isRight ? 1 : -1;
      ctx.moveTo(nDir * (w / 2 - 2), -8);
      ctx.lineTo(nDir * (w / 2 + 6), -4);
      ctx.lineTo(nDir * (w / 2 - 2), 0);
      ctx.fill();
      break;
    }

    case 'candle': {
      const w = item.width;
      const h = item.height;

      // Candle wax stick
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 16, w - 8, h - 16);

      // Wick
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 + 16);
      ctx.lineTo(0, -h / 2 + 10);
      ctx.stroke();

      // Flickering teardrop flame
      const flicker = (Math.random() - 0.5) * 2;
      const flameGrad = ctx.createRadialGradient(flicker, -h / 2 + 4, 1, 0, -h / 2 + 4, 8);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#facc15');
      flameGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.ellipse(flicker, -h / 2 + 3, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rocket': {
      const w = item.width;
      const h = item.height;

      // Fuselage (red & white retro rocket)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, -h / 2 + 16);
      ctx.lineTo(w / 2, h / 2 - 8);
      ctx.lineTo(-w / 2, h / 2 - 8);
      ctx.lineTo(-w / 2, -h / 2 + 16);
      ctx.closePath();
      ctx.fill();

      // White stripe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w / 2, -h / 2 + 22, w, 12);

      // Porthole window
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -h / 2 + 28, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Side stabilizer fins
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(-w / 2, h / 2 - 14);
      ctx.lineTo(-w / 2 - 6, h / 2 - 2);
      ctx.lineTo(-w / 2, h / 2 - 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 - 14);
      ctx.lineTo(w / 2 + 6, h / 2 - 2);
      ctx.lineTo(w / 2, h / 2 - 2);
      ctx.fill();

      // Fuse string at bottom
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - 8);
      ctx.lineTo(0, h / 2 + 4);
      ctx.stroke();
      break;
    }

    case 'switch_pad': {
      const w = item.width;
      const h = item.height;
      const isPressed = Boolean(item.stateData?.isPressed);

      // Metal base
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w / 2, -h / 2 + 6, w, h - 6);
      ctx.strokeStyle = '#64748b';
      ctx.strokeRect(-w / 2, -h / 2 + 6, w, h - 6);

      // Pressure pad button
      ctx.fillStyle = isPressed ? '#16a34a' : '#dc2626';
      const padY = isPressed ? -h / 2 + 4 : -h / 2;
      const padH = isPressed ? 4 : 8;
      ctx.fillRect(-w / 2 + 8, padY, w - 16, padH);
      break;
    }

    case 'boxing_glove': {
      const w = item.width;
      const h = item.height;
      const punchOffset = (item.stateData?.punchProgress || 0) * 35;

      // Scissor accordion arm
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w / 2 + 10 + punchOffset * 0.3, -8);
      ctx.lineTo(-w / 2 + 20 + punchOffset * 0.6, 8);
      ctx.lineTo(-w / 2 + 30 + punchOffset, 0);
      ctx.stroke();

      // Red cartoon boxing glove
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(-w / 2 + 42 + punchOffset, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }

    case 'bell_target': {
      const w = item.width;
      const h = item.height;
      const hasRung = Boolean(item.stateData?.hasRung);

      // Top suspension ring
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-4, -h / 2, 8, 8);

      // Gleaming brass bell cup
      ctx.fillStyle = hasRung ? '#fef08a' : '#eab308';
      ctx.beginPath();
      ctx.moveTo(-6, -h / 2 + 8);
      ctx.quadraticCurveTo(-w / 2, h / 2 - 10, -w / 2, h / 2 - 4);
      ctx.lineTo(w / 2, h / 2 - 4);
      ctx.quadraticCurveTo(w / 2, h / 2 - 10, 6, -h / 2 + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Clapper
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, h / 2 - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'basket_target': {
      const w = item.width;
      const h = item.height;

      // Woven wicker basket
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(w / 2 - 8, h / 2);
      ctx.lineTo(-w / 2 + 8, h / 2);
      ctx.closePath();
      ctx.fill();

      // Wicker crosshatch pattern
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      for (let i = -w / 2 + 8; i < w / 2 - 8; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, -h / 2);
        ctx.lineTo(i + 4, h / 2);
        ctx.stroke();
      }

      // Top rim
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, 5);
      break;
    }

    case 'balloon_target_pin': {
      const w = item.width;
      const h = item.height;

      // Base block
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w / 2, h / 2 - 8, w, 8);

      // Steel needle point
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(3, h / 2 - 8);
      ctx.lineTo(-3, h / 2 - 8);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
