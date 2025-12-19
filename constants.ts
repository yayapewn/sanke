import { Language, LevelConfig } from './types';

const createPattern = (color1: string, color2: string, type: 'weave' | 'stripe' | 'rope' | 'checker' | 'diagonal'): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  canvas.width = 128; 
  canvas.height = 64;  

  if (type === 'stripe') {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = color2;
    ctx.fillRect(0, 15, 128, 34);
  } else if (type === 'weave') {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = color2;
    for(let i=0; i<128; i+=8) {
        ctx.fillRect(i, 0, 4, 64);
    }
  } else if (type === 'rope') {
    ctx.fillStyle = color1;
    ctx.fillRect(0,0,128,64);
    ctx.fillStyle = color2;
    ctx.beginPath();
    for (let i = -40; i < 168; i += 40) {
        ctx.moveTo(i, 0); ctx.lineTo(i + 20, 64); ctx.lineTo(i + 40, 64); ctx.lineTo(i + 20, 0);
    }
    ctx.fill();
  } else if (type === 'checker') {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = color2;
    const size = 16;
    for (let y = 0; y < 64; y += size) {
        for (let x = 0; x < 128; x += size) {
            if ((x / size + y / size) % 2 === 0) {
                ctx.fillRect(x, y, size, size);
            }
        }
    }
  } else if (type === 'diagonal') {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = color2;
    ctx.beginPath();
    const w = 24;
    for (let i = -64; i < 192; i += 48) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + w, 0);
        ctx.lineTo(i + w - 20, 64);
        ctx.lineTo(i - 20, 64);
    }
    ctx.fill();
  }

  return canvas.toDataURL();
};

export const ENEMY_TEXTURE_SRC = createPattern('#1a0000', '#ff0000', 'diagonal');

export const TEXTURES = [
  { 
    id: 'tech-tape', 
    name: 'Paiho Easy Tape', 
    src: createPattern('#0f172a', '#38bdf8', 'stripe'),
    width: 20,
    description_zh: "高強度合成聚合物，具備未來感光澤與防水特性。",
    description_en: "High-strength synthetic polymer with a futuristic sheen."
  },
  { 
    id: 'eco-rope', 
    name: 'Eco Rope', 
    src: createPattern('#78350f', '#d97706', 'rope'),
    width: 20,
    description_zh: "100%回收天然有機纖維編織，觸感溫潤。",
    description_en: "Woven from 100% recycled organic fibers."
  },
  { 
    id: 'sport-mesh', 
    name: 'Sport Mesh', 
    src: createPattern('#be123c', '#fb7185', 'weave'),
    width: 20,
    description_zh: "輕量化透氣高彈性網布，極致舒適感。",
    description_en: "Lightweight, breathable high-elasticity mesh."
  },
  { 
    id: 'luxe-jacquard', 
    name: 'Luxe Gold', 
    src: createPattern('#1c1917', '#fbbf24', 'checker'),
    width: 20,
    description_zh: "高級訂製提花織帶，呈現低調奢華。",
    description_en: "Premium jacquard woven for luxury fashion."
  },
  { 
    id: 'neon-safety', 
    name: 'Neon Safety', 
    src: createPattern('#374151', '#a3e635', 'diagonal'),
    width: 20,
    description_zh: "高視認性反光材質，斜紋設計確保安全。",
    description_en: "High-visibility reflective material for safety."
  },
];

export const UI_TEXT = {
  [Language.ZH]: {
    start: "開始挑戰",
    next: "下一關",
    finish: "查看設計報表",
    upload: "上傳材質",
    level_title: "百和織帶貪食蛇",
    result_title: "百和織帶貪食蛇",
    scan: "掃描保存您的專屬材質",
    download: "單張下載",
    download_all: "下載成果",
    restart: "重新挑戰",
    analyzing: "分數",
    success: "挑戰成功！",
    time: "時間",
    thickness: "粗細",
    undo: "重新挑戰",
    redo: "重做",
    material_info: "材質履歷",
    level_complete: "挑戰通關",
    score: "得分",
    continue: "繼續",
    perfect: "神乎其技",
    awesome: "表現優異",
    good: "編織高手",
    name: "材質名稱",
    traits: "材質特性",
    memo: "AI 備忘錄",
    used_materials: "遊戲中使用的織帶",
    user_memo: "備註",
    user_memo_placeholder: "在此寫下您的設計筆記...",
    clear: "清除",
    balance_hint: "收集紗線球以達到目標分數",
    game_over: "挑戰失敗",
    retry: "再試一次",
    time_up: "時間到",
    out_of_hp: "生命值耗盡",
    level01: "第一關挑戰",
    level02: "第二關挑戰",
    hub_label: "百和材料圖書館"
  },
  [Language.EN]: {
    start: "Start",
    next: "Next Level",
    finish: "Final Report",
    upload: "Upload",
    level_title: "Paiho Ribbon Snake",
    result_title: "Paiho Ribbon Snake",
    scan: "Scan to save",
    download: "Download",
    download_all: "Download Results",
    restart: "Restart",
    analyzing: "Score",
    success: "Success!",
    time: "Time",
    thickness: "Size",
    undo: "Retry",
    redo: "Redo",
    material_info: "Info",
    level_complete: "Stage Clear",
    score: "Score",
    continue: "Continue",
    perfect: "Masterpiece",
    awesome: "Great",
    good: "Good",
    name: "Material",
    traits: "Traits",
    memo: "Memo",
    used_materials: "Ribbons Used",
    user_memo: "Notes",
    user_memo_placeholder: "Type here...",
    clear: "Clear",
    balance_hint: "Collect yarn balls to reach target score",
    game_over: "Game Over",
    retry: "Retry",
    time_up: "Time Up",
    out_of_hp: "Out of HP",
    level01: "Level 01 Challenge",
    level02: "Level 02 Challenge",
    hub_label: "Paiho Material Library"
  }
};

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    id: 1,
    targetScore: 100, 
    timeLimit: 90,     
    hint_zh: "第一關：收集紗線球達到分數 100。",
    hint_en: "Level 1: Collect items to reach score 100."
  },
  2: {
    id: 2,
    targetScore: 200,
    timeLimit: 120,
    hint_zh: "第二關：避開惡魔織帶蛇，達到分數 200。",
    hint_en: "Level 2: Avoid Evil Snakes and reach score 200."
  }
};