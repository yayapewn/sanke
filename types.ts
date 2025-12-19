
export interface Point {
  x: number;
  y: number;
}

// Updated: Stroke now remembers which texture and width was used
export interface Stroke {
  points: Point[];
  textureId: string;
  textureSrc: string; // Data URI to ensure we can render it even if config changes
  baseWidth: number;  // The intrinsic width of the texture
  scale: number;      // The user-selected multiplier (strokeWidth)
}

export interface TextureAsset {
  id: string;
  name: string;
  src: string; // Data URI or URL
  width: number; // Render width
  description_zh?: string;
  description_en?: string;
}

export enum GameStage {
  INTRO = 'INTRO',
  GAME = 'GAME', 
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  RESULT = 'RESULT',
}

export interface LevelConfig {
  id: number;
  targetScore: number; // Items to eat
  timeLimit: number; // Seconds (optional context)
  hint_zh: string;
  hint_en: string;
}

export enum Language {
  ZH = 'ZH',
  EN = 'EN',
}

// Snake Game Entities
export interface GameEntity {
  id: string;
  x: number;
  y: number;
  // Fix: Added 'heart' to the allowed types for GameEntity
  type: 'food' | 'bomb' | 'heart';
  radius: number;
}

// Fix: Added EnemySnake interface as it was missing and required by RibbonCanvas
export interface EnemySnake {
  id: string;
  head: Point;
  dir: Point;
  path: Point[];
  length: number;
}