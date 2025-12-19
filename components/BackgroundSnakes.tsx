
import React, { useEffect, useRef } from 'react';
import { TEXTURES } from '../constants';
import { Point } from '../types';
import { smoothStroke, getRibbonMesh } from '../utils/geometry';

interface AutonomousSnake {
  path: Point[];
  texture: typeof TEXTURES[0];
  angle: number;
  speed: number;
  width: number;
  turnSpeed: number;
  hueRotate: number;
}

interface BackgroundSnakesProps {
  count?: number;
}

const BackgroundSnakes: React.FC<BackgroundSnakesProps> = ({ count = 4 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakes = useRef<AutonomousSnake[]>([]);
  const textureCache = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      TEXTURES.forEach(tex => {
        if (!textureCache.current[tex.src]) {
          const img = new Image();
          img.src = tex.src;
          img.onload = () => { textureCache.current[tex.src] = img; };
        }
      });

      snakes.current = Array.from({ length: count }).map((_, i) => {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const path: Point[] = Array.from({ length: 30 }).map(() => ({ x: startX, y: startY }));
        
        return {
          path,
          texture: TEXTURES[i % TEXTURES.length],
          angle: Math.random() * Math.PI * 2,
          speed: 1.2 + Math.random() * 2,
          width: 14 + Math.random() * 10,
          turnSpeed: 0.03 + Math.random() * 0.05,
          hueRotate: Math.random() * 30 - 15
        };
      });
    };

    const drawSnake = (snake: AutonomousSnake) => {
      const img = textureCache.current[snake.texture.src];
      if (!img || !ctx) return;

      const smoothed = smoothStroke(snake.path, 3);
      const mesh = getRibbonMesh(smoothed, 4, snake.width);
      if (mesh.length < 2) return;

      const sc = snake.width / img.height;

      ctx.save();
      ctx.filter = `hue-rotate(${snake.hueRotate}deg)`;
      
      // Softer, more "cute" shadow
      ctx.shadowColor = 'rgba(79, 70, 229, 0.08)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 6;

      for (let i = 0; i < mesh.length - 1; i++) {
        const curr = mesh[i];
        const next = mesh[i + 1];

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

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angleVal);

        const texX = (curr.dist / sc);
        const texW = Math.sqrt(Math.pow(next.center.x - curr.center.x, 2) + Math.pow(next.center.y - curr.center.y, 2)) / sc;
        const safeX = (texX % img.width + img.width) % img.width;

        ctx.drawImage(
          img,
          safeX, 0, texW + 0.5, img.height,
          -texW * sc / 2 - 0.5, -snake.width / 2 - 0.5,
          texW * sc + 1, snake.width + 1
        );
        ctx.restore();
      }
      ctx.restore();
    };

    let frameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      snakes.current.forEach(snake => {
        // More organic slithering
        snake.angle += Math.sin(Date.now() / 800) * snake.turnSpeed + (Math.random() - 0.5) * 0.1;
        
        const head = snake.path[0];
        let nextX = head.x + Math.cos(snake.angle) * snake.speed;
        let nextY = head.y + Math.sin(snake.angle) * snake.speed;

        const buffer = 150;
        if (nextX < -buffer) nextX = width + buffer;
        if (nextX > width + buffer) nextX = -buffer;
        if (nextY < -buffer) nextY = height + buffer;
        if (nextY > height + buffer) nextY = -buffer;

        snake.path.unshift({ x: nextX, y: nextY });
        snake.path.pop();

        drawSnake(snake);
      });

      frameId = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', init);
    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(frameId);
    };
  }, [count]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" />;
};

export default BackgroundSnakes;
