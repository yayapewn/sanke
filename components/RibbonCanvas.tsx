import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, TextureAsset, LevelConfig, GameEntity, EnemySnake } from '../types';
import { smoothStroke, getRibbonMesh, distance } from '../utils/geometry';
import { TEXTURES, ENEMY_TEXTURE_SRC } from '../constants';

interface RibbonCanvasProps {
  currentTexture: TextureAsset;
  strokeWidth: number; 
  levelConfig: LevelConfig;
  onProgressUpdate: (count: number) => void;
  onHPUpdate: (hp: number) => void;
  onGameOver: (win: boolean, texture: TextureAsset) => void;
  isInteractive: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  dpadDir?: Point | null;
}

const RibbonCanvas: React.FC<RibbonCanvasProps> = ({ 
  currentTexture, 
  strokeWidth,
  levelConfig, 
  onProgressUpdate,
  onHPUpdate,
  onGameOver,
  isInteractive,
  onCanvasReady,
  dpadDir
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const snakePath = useRef<Point[]>([]);
  const snakeHead = useRef<Point>({ x: 0, y: 0 });
  const snakeDir = useRef<Point>({ x: 1, y: 0 }); 
  const targetPos = useRef<Point>({ x: 0, y: 0 }); 
  const currentLength = useRef(30);
  const currentScore = useRef(0);

  const entities = useRef<GameEntity[]>([]);
  const hpRef = useRef(5); 
  const gameState = useRef<'PLAYING' | 'OVER' | 'WIN'>('PLAYING');
  const lastDamageTime = useRef(0);
  
  const enemySnakes = useRef<EnemySnake[]>([]);
  const scaleRef = useRef(1); 

  const BASE_SPEED = 4.2;
  const TURN_SPEED = 0.16;
  const SEGMENT_SPACING = 5; 
  const WIN_SCORE = levelConfig.targetScore;

  const textureCache = useRef<Record<string, HTMLImageElement>>({});
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  useEffect(() => {
    const loadAllTextures = async () => {
      const allSrcs = [...TEXTURES.map(t => t.src), ENEMY_TEXTURE_SRC];
      const promises = allSrcs.map(src => {
        return new Promise<void>((resolve) => {
          if (textureCache.current[src]) {
            resolve();
            return;
          }
          const img = new Image();
          img.src = src;
          img.onload = () => {
            textureCache.current[src] = img;
            resolve();
          };
          img.onerror = () => resolve(); 
        });
      });
      await Promise.all(promises);
      setTexturesLoaded(true);
    };
    loadAllTextures();
  }, []);

  useEffect(() => {
    if (currentTexture.src && !textureCache.current[currentTexture.src]) {
        const img = new Image();
        img.src = currentTexture.src;
        img.onload = () => {
            textureCache.current[currentTexture.src] = img;
        };
    }
  }, [currentTexture.src]);

  useEffect(() => {
    if (canvasRef.current) onCanvasReady(canvasRef.current);
  }, [onCanvasReady]);

  const updateScaleFactor = (width: number, height: number) => {
      const minDim = Math.min(width, height);
      scaleRef.current = Math.max(0.4, minDim / 800);
  };

  const spawnEntity = useCallback((w: number, h: number, type: 'food' | 'bomb' | 'heart') => {
      const s = scaleRef.current;
      
      // Define UI exclusion zones (scaled)
      const topHeight = 110; 
      const sideMargin = 220;
      const bottomHeight = 110;
      const dpadSize = 180;

      const isInUIZone = (px: number, py: number) => {
        // Top Left: Score & HP
        if (px < sideMargin && py < topHeight) return true;
        // Top Right: Timer
        if (px > w - 160 && py < topHeight) return true;
        // Bottom Left: D-pad
        if (px < dpadSize && py > h - dpadSize) return true;
        // Bottom Center: Texture Bar
        if (px > w/2 - 250 && px < w/2 + 250 && py > h - bottomHeight) return true;
        
        return false;
      };

      let x = 0, y = 0, attempts = 0;
      const safeZoneRadius = Math.min(w * 0.4, h * 0.4, 180 * s);
      
      do {
          x = 40 + Math.random() * (w - 80);
          y = 40 + Math.random() * (h - 80);
          attempts++;
          
          const inUI = isInUIZone(x, y);
          const tooCloseToHead = distance({x, y}, snakeHead.current) < safeZoneRadius;
          
          if (!inUI && (!tooCloseToHead || attempts > 30)) break;
      } while (attempts < 50);
      
      let baseRadius = 16;
      if (type === 'bomb') baseRadius = 18; 
      if (type === 'heart') baseRadius = 18;
      const radius = baseRadius * s;
      entities.current.push({ id: Math.random().toString(), x, y, type, radius });
  }, []);

  const initGame = useCallback((width: number, height: number) => {
      const cx = width / 2;
      const cy = height / 2;
      snakeHead.current = { x: cx, y: cy };
      snakeDir.current = { x: 1, y: 0 };
      targetPos.current = { x: cx + 120, y: cy }; 
      snakePath.current = [];
      updateScaleFactor(width, height);

      for(let i=0; i<30; i++) {
          snakePath.current.push({ x: cx - (i * SEGMENT_SPACING), y: cy });
      }

      currentLength.current = 30;
      currentScore.current = 0;
      hpRef.current = 5; 
      gameState.current = 'PLAYING';
      entities.current = [];
      lastDamageTime.current = 0;
      onProgressUpdate(0);
      onHPUpdate(5);

      for(let i=0; i<5; i++) spawnEntity(width, height, 'food');
      for(let i=0; i<3; i++) spawnEntity(width, height, 'bomb');
      spawnEntity(width, height, 'heart');

      if (levelConfig.id === 2) {
          enemySnakes.current = [];
          for (let i = 0; i < 3; i++) {
              const startX = Math.random() * width;
              const startY = Math.random() * height;
              const enemy: EnemySnake = {
                  id: `enemy-${i}`,
                  head: { x: startX, y: startY },
                  dir: { x: Math.cos(i), y: Math.sin(i) },
                  path: [],
                  length: 75
              };
              for (let j = 0; j < 75; j++) enemy.path.push({ x: startX, y: startY });
              enemySnakes.current.push(enemy);
          }
      } else {
          enemySnakes.current = [];
      }
  }, [onProgressUpdate, onHPUpdate, levelConfig.id, spawnEntity]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        updateScaleFactor(width, height);
        
        if (gameState.current === 'PLAYING' && (snakePath.current.length === 0 || entities.current.length === 0)) {
             initGame(width, height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [initGame]); 

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !texturesLoaded || gameState.current !== 'PLAYING') return;
    
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    if (dpadDir) {
        const targetAngle = Math.atan2(dpadDir.y, dpadDir.x);
        const currentAngle = Math.atan2(snakeDir.current.y, snakeDir.current.x);
        let diff = targetAngle - currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED);
        snakeDir.current = { x: Math.cos(newAngle), y: Math.sin(newAngle) };
        targetPos.current = { 
            x: snakeHead.current.x + snakeDir.current.x * 100,
            y: snakeHead.current.y + snakeDir.current.y * 100
        };
    } else {
        const dx = targetPos.current.x - snakeHead.current.x;
        const dy = targetPos.current.y - snakeHead.current.y;
        const distToTarget = Math.sqrt(dx*dx + dy*dy);

        if (distToTarget > 10) {
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(snakeDir.current.y, snakeDir.current.x);
            let diff = targetAngle - currentAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED);
            snakeDir.current = { x: Math.cos(newAngle), y: Math.sin(newAngle) };
        }
    }

    const currentSpeed = BASE_SPEED * scaleRef.current;
    snakeHead.current.x += snakeDir.current.x * currentSpeed;
    snakeHead.current.y += snakeDir.current.y * currentSpeed;

    if (snakeHead.current.x < 0) snakeHead.current.x = width;
    if (snakeHead.current.x > width) snakeHead.current.x = 0;
    if (snakeHead.current.y < 0) snakeHead.current.y = height;
    if (snakeHead.current.y > height) snakeHead.current.y = 0;

    snakePath.current.unshift({ ...snakeHead.current });
    if (snakePath.current.length > currentLength.current) snakePath.current.pop();

    enemySnakes.current.forEach(enemy => {
        if (Math.random() < 0.04) {
            const angle = Math.atan2(enemy.dir.y, enemy.dir.x) + (Math.random() - 0.5) * 1.8;
            enemy.dir = { x: Math.cos(angle), y: Math.sin(angle) };
        }
        enemy.head.x += enemy.dir.x * (currentSpeed * 0.75);
        enemy.head.y += enemy.dir.y * (currentSpeed * 0.75);
        if (enemy.head.x < 0) enemy.head.x = width;
        if (enemy.head.x > width) enemy.head.x = 0;
        if (enemy.head.y < 0) enemy.head.y = height;
        if (enemy.head.y > height) enemy.head.y = 0;
        enemy.path.unshift({ ...enemy.head });
        if (enemy.path.length > enemy.length) enemy.path.pop();
    });

    const head = snakeHead.current;
    const now = Date.now();
    const isInvincible = now - lastDamageTime.current < 2200;

    for (let i = entities.current.length - 1; i >= 0; i--) {
        const ent = entities.current[i];
        if (distance(head, ent) < ent.radius + 12 * scaleRef.current) { 
            entities.current.splice(i, 1);
            if (ent.type === 'food') {
                currentScore.current += 10;
                currentLength.current += 10;
                onProgressUpdate(currentScore.current); 
                if (currentScore.current >= WIN_SCORE) {
                    gameState.current = 'WIN';
                    onGameOver(true, currentTexture);
                    return;
                }
                spawnEntity(width, height, 'food');
            } else if (ent.type === 'bomb') {
                if (!isInvincible) takeDamage();
                spawnEntity(width, height, 'bomb');
            } else if (ent.type === 'heart') {
                if (hpRef.current < 5) { hpRef.current += 1; onHPUpdate(hpRef.current); }
                spawnEntity(width, height, 'heart');
            }
        }
    }

    if (!isInvincible && levelConfig.id === 2) {
        enemySnakes.current.forEach(enemy => {
            for (let i = 0; i < enemy.path.length; i += 6) {
                if (distance(head, enemy.path[i]) < 22 * scaleRef.current) {
                    takeDamage();
                    break;
                }
            }
        });
    }

    if (!isInvincible && snakePath.current.length > 45) { 
        const visualWidth = currentTexture.width * strokeWidth * scaleRef.current;
        const collisionRadius = visualWidth * 0.38; 
        for (let i = 45; i < snakePath.current.length; i += 2) {
            if (distance(head, snakePath.current[i]) < collisionRadius) { 
                takeDamage();
                break;
            }
        }
    }
  }, [texturesLoaded, currentTexture, levelConfig, onProgressUpdate, onHPUpdate, onGameOver, strokeWidth, WIN_SCORE, spawnEntity, dpadDir]);

  const takeDamage = () => {
      hpRef.current -= 1;
      onHPUpdate(hpRef.current);
      lastDamageTime.current = Date.now();
      if (hpRef.current <= 0) {
          gameState.current = 'OVER';
          onGameOver(false, currentTexture); 
      }
  };

  const drawSnakeHeadDetails = (ctx: CanvasRenderingContext2D, pos: Point, dir: Point, type: 'player' | 'enemy') => {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      const angle = Math.atan2(dir.y, dir.x);
      ctx.rotate(angle);

      const s = scaleRef.current;
      const headSize = 12 * s;

      const tongueTime = (Date.now() % 1000) / 1000;
      const isTongueOut = tongueTime > 0.6;
      if (isTongueOut) {
          ctx.beginPath();
          ctx.strokeStyle = type === 'player' ? '#fb7185' : '#000000';
          ctx.lineWidth = 2 * s;
          const tongueLen = (0.5 + Math.sin(Date.now() * 0.05) * 0.5) * 12 * s;
          ctx.moveTo(headSize, 0);
          ctx.lineTo(headSize + tongueLen, 0);
          ctx.lineTo(headSize + tongueLen + 4*s, -3*s);
          ctx.moveTo(headSize + tongueLen, 0);
          ctx.lineTo(headSize + tongueLen + 4*s, 3*s);
          ctx.stroke();
      }

      if (type === 'player') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(4*s, -6*s, 5*s, 0, Math.PI * 2);
          ctx.arc(4*s, 6*s, 5*s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(6*s, -6*s, 2*s, 0, Math.PI * 2);
          ctx.arc(6*s, 6*s, 2*s, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(-2*s, -8*s); ctx.lineTo(-8*s, -16*s); ctx.lineTo(2*s, -10*s); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-2*s, 8*s); ctx.lineTo(-8*s, 16*s); ctx.lineTo(2*s, 10*s); ctx.fill();

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.ellipse(6*s, -6*s, 5*s, 2.5*s, -Math.PI/6, 0, Math.PI*2);
          ctx.ellipse(6*s, 6*s, 5*s, 2.5*s, Math.PI/6, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = '#ffcccc';
          ctx.beginPath();
          ctx.arc(7*s, -6*s, 1.2*s, 0, Math.PI*2);
          ctx.arc(7*s, 6*s, 1.2*s, 0, Math.PI*2);
          ctx.fill();
      }
      ctx.restore();
  };

  const drawRibbonMeshEx = (ctx: CanvasRenderingContext2D, rawPoints: Point[], thickness: number, img: HTMLImageElement) => {
    if (rawPoints.length < 2) return;
    
    const segments: Point[][] = []; 
    let current: Point[] = [];
    const JUMP = 100 * scaleRef.current; 

    for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        if (current.length > 0) {
            const prev = current[current.length - 1];
            if (Math.abs(p.x - prev.x) > JUMP || Math.abs(p.y - prev.y) > JUMP) {
                if (current.length >= 2) segments.push(current);
                current = [];
            }
        }
        current.push(p);
    }
    if (current.length >= 2) segments.push(current);

    segments.forEach(seg => {
        const smoothed = smoothStroke(seg, 3);
        if (smoothed.length < 2) return;

        ctx.save();
        ctx.beginPath();
        smoothed.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.lineJoin = 'round'; 
        ctx.lineCap = 'round'; 
        ctx.lineWidth = thickness + 2; 
        ctx.strokeStyle = '#0f172a'; 
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.restore();

        const mesh = getRibbonMesh(smoothed, 1.5, thickness); 
        if (mesh.length < 2) return;
        const sc = thickness / img.height; 

        for (let i = 0; i < mesh.length - 1; i++) {
            const curr = mesh[i]; 
            const next = mesh[i+1];
            
            ctx.save(); 
            ctx.beginPath();
            ctx.moveTo(curr.left.x, curr.left.y); 
            ctx.lineTo(curr.right.x, curr.right.y);
            ctx.lineTo(next.right.x, next.right.y); 
            ctx.lineTo(next.left.x, next.left.y);
            ctx.closePath(); 
            ctx.clip();

            const angleVal = Math.atan2(next.center.y - curr.center.y, next.center.x - curr.center.x);
            const midX = (curr.center.x + next.center.x) / 2; 
            const midY = (curr.center.y + next.center.y) / 2;
            
            ctx.translate(midX, midY); 
            ctx.rotate(angleVal);

            const poly = [curr.left, curr.right, next.right, next.left];
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            const cosA = Math.cos(-angleVal), sinA = Math.sin(-angleVal);
            for (const p of poly) {
                const px = p.x - midX, py = p.y - midY;
                const lx = px * cosA - py * sinA, ly = px * sinA + py * cosA;
                minX = Math.min(minX, lx); maxX = Math.max(maxX, lx); 
                minY = Math.min(minY, ly); maxY = Math.max(maxY, ly);
            }
            
            const texX = (curr.dist / sc); 
            const texW = (maxX - minX) / sc;
            const safeX = (texX % img.width + img.width) % img.width;

            ctx.drawImage(
                img, 
                safeX, 0, texW, img.height, 
                minX - 0.7, minY - 0.5, 
                (maxX - minX) + 1.8, (maxY - minY) + 1.2
            );
            ctx.restore();
        }
    });
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    entities.current.forEach(ent => {
        if (ent.type === 'food') drawYarnBall(ctx, ent.x, ent.y, ent.radius);
        else if (ent.type === 'bomb') drawBomb(ctx, ent.x, ent.y, ent.radius);
        else if (ent.type === 'heart') drawHeart(ctx, ent.x, ent.y, ent.radius);
    });

    const renderHeight = 20 * strokeWidth * scaleRef.current; 

    const enemyImg = textureCache.current[ENEMY_TEXTURE_SRC];
    if (enemyImg && levelConfig.id === 2) {
        enemySnakes.current.forEach(enemy => {
            drawRibbonMeshEx(ctx, enemy.path, renderHeight, enemyImg);
            drawSnakeHeadDetails(ctx, enemy.head, enemy.dir, 'enemy');
        });
    }

    const now = Date.now();
    const isDamageInvulnerable = now - lastDamageTime.current < 2200;
    if (!isDamageInvulnerable || Math.floor(now / 120) % 2 === 0) {
        const img = textureCache.current[currentTexture.src];
        if (img && snakePath.current.length > 2) {
            drawRibbonMeshEx(ctx, snakePath.current, renderHeight, img);
            drawSnakeHeadDetails(ctx, snakeHead.current, snakeDir.current, 'player');
        }
    }
    ctx.restore();
  }, [currentTexture, strokeWidth, levelConfig.id]);

  useEffect(() => {
    let afId: number;
    const loop = () => { update(); render(); afId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(afId);
  }, [update, render]);

  const drawYarnBall = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 1.2 * scaleRef.current; 
      ctx.beginPath();
      for(let i=0; i<6; i++) {
          const rx = Math.random() * r; const ry = Math.random() * r;
          ctx.ellipse(0, 0, rx, ry, Math.random()*Math.PI, 0, Math.PI * 2);
      }
      ctx.stroke(); ctx.restore();
  };

  const drawBomb = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.save(); ctx.translate(x, y);
      const s = scaleRef.current;
      
      // Bomb Body - Red
      ctx.fillStyle = '#ef4444'; 
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      
      // Bomb Cap
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-r*0.25, -r*1.15, r*0.5, r*0.35);
      
      // Bomb Fuse
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(0, -r*1.15);
      ctx.quadraticCurveTo(r*0.6, -r*1.5, r*0.9, -r*1.2);
      ctx.stroke();

      // Spark Animation
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const sparkR = r * 0.3 * (1 + Math.sin(Date.now() * 0.12) * 0.25);
      ctx.arc(r*0.9, -r*1.2, sparkR, 0, Math.PI*2);
      ctx.fill();

      // Bomb highlight
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(-r*0.35, -r*0.35, r*0.25, 0, Math.PI*2); ctx.fill();
      
      ctx.restore();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      ctx.save(); ctx.translate(x, y);
      const s = 1 + Math.sin(Date.now() / 250) * 0.12;
      ctx.scale(s, s); ctx.fillStyle = '#ec4899'; 
      ctx.beginPath(); ctx.moveTo(0, r * 0.3);
      ctx.bezierCurveTo(0, -r * 0.5, -r, -r * 0.5, -r, 0); ctx.bezierCurveTo(-r, r * 0.5, -r * 0.5, r, 0, r * 1.2);
      ctx.bezierCurveTo(r * 0.5, r, r, r * 0.5, r, 0); ctx.bezierCurveTo(r, -r * 0.5, 0, -r * 0.5, 0, r * 0.3);
      ctx.fill(); ctx.restore();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isInteractive || dpadDir) return; 
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    targetPos.current = { x: (cx - rect.left) * (window.devicePixelRatio || 1), y: (cy - rect.top) * (window.devicePixelRatio || 1) };
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white rounded-xl shadow-inner border border-slate-100 overflow-hidden touch-none cursor-crosshair">
      <canvas ref={canvasRef} onMouseMove={handleMove} onTouchMove={handleMove} onMouseDown={handleMove} onTouchStart={handleMove} className="block w-full h-full touch-none" />
    </div>
  );
};

export default RibbonCanvas;