import React, { useState, useEffect, useRef } from 'react';
import { UI_TEXT, TEXTURES } from '../constants';
import { Language, TextureAsset, LevelConfig, Point } from '../types';

interface GameHUDProps {
  lang: Language;
  level: number;
  levelConfig: LevelConfig;
  progress: number;
  hp: number; 
  currentTexture: TextureAsset;
  onSelectTexture: (t: TextureAsset) => void;
  onNext: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canUndo: boolean; 
  canRedo: boolean; 
  onUndo: () => void;
  onRedo: () => void;
  timeLeft?: number;
  isMobile?: boolean;
  setDpadDir?: (dir: Point | null) => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
  lang,
  hp,
  progress,
  currentTexture,
  onSelectTexture,
  onUpload,
  timeLeft,
  levelConfig,
  setDpadDir
}) => {
  const t = UI_TEXT[lang];
  const isCriticalTime = (timeLeft || 0) < 10;
  
  // Joystick State
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsJoystickActive(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive && e.type !== 'touchstart' && e.type !== 'mousedown') return;
    if (!joystickBaseRef.current) return;

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;
    
    // Normalize and clamp knob position
    const limitedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * (limitedDist / maxRadius);
    const ny = Math.sin(angle) * (limitedDist / maxRadius);

    setKnobPos({ x: nx * 38, y: ny * 38 }); 
    if (setDpadDir) {
      setDpadDir({ x: nx, y: ny }); 
    }
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setKnobPos({ x: 0, y: 0 });
    if (setDpadDir) {
      setDpadDir(null);
    }
  };

  useEffect(() => {
    if (isJoystickActive) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleJoystickMove(e as any);
      const endHandler = () => handleJoystickEnd();
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', endHandler);
      window.addEventListener('touchmove', moveHandler, { passive: false });
      window.addEventListener('touchend', endHandler);
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', endHandler);
      };
    }
  }, [isJoystickActive]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50">
      
      <style>{`
        @keyframes timer-tick {
          0% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-timer-tick {
          animation: timer-tick 0.3s ease-out forwards;
        }
        @keyframes score-pop {
          0% { transform: translateY(5px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-score-pop {
          animation: score-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .joystick-container {
          position: absolute;
          bottom: 2.5rem;
          left: 2.5rem;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .joystick-base {
          width: 140px;
          height: 140px;
          background: rgba(30, 41, 59, 0.25); /* Sleek dark blue-grey transparent */
          backdrop-filter: blur(12px);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          touch-action: none;
          box-shadow: 
            0 10px 40px -10px rgba(0,0,0,0.3),
            inset 0 2px 10px rgba(255,255,255,0.05);
        }

        /* Directional Indicators */
        .joystick-base::before {
          content: '';
          position: absolute;
          width: 85%;
          height: 85%;
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 50%;
          pointer-events: none;
        }

        .joystick-knob {
          width: 58px;
          height: 58px;
          background: linear-gradient(135deg, #e5e7eb, #9ca3af); /* Sophisticated metallic gradient */
          border-radius: 50%;
          transition: transform 0.08s ease-out;
          box-shadow: 
            0 8px 24px rgba(0,0,0,0.4), 
            inset 0 2px 4px rgba(255,255,255,0.8),
            inset 0 -2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        
        /* Inner circle decoration for the knob */
        .joystick-knob::after {
          content: '';
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,0.05);
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Directional Dots on Base */
        .dir-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
        }
        .dot-u { top: 12px; left: 50%; transform: translateX(-50%); }
        .dot-d { bottom: 12px; left: 50%; transform: translateX(-50%); }
        .dot-l { left: 12px; top: 50%; transform: translateY(-50%); }
        .dot-r { right: 12px; top: 50%; transform: translateY(-50%); }
      `}</style>
      
      {/* --- Top Bar: Score, HP and Timer --- */}
      <div className="flex justify-between items-start w-full relative h-24 px-4">
        <div className="flex flex-col items-start pt-2">
            <span className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">
                {t.analyzing}
            </span>
            <div className="flex items-baseline gap-2 mb-1">
                <span key={progress} className="text-5xl md:text-6xl font-black text-slate-900/10 tabular-nums leading-none animate-score-pop">
                    {progress}
                </span>
                <span className="text-slate-200 font-bold text-xl">/ {levelConfig.targetScore}</span>
            </div>
            
            <div className="flex gap-1.5 pointer-events-none">
               {[1, 2, 3, 4, 5].map(i => (
                   <div 
                      key={i} 
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-black transition-all duration-300 ${
                        i <= hp 
                          ? 'bg-orange-500 text-white shadow-sm scale-100' 
                          : 'bg-slate-200 text-slate-400 opacity-20 scale-75'
                      }`}
                   >
                      <span className="text-[7px]">P</span>
                   </div>
               ))}
            </div>
        </div>

        <div className="flex flex-col items-end pt-2">
            <span className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">
                {t.time}
            </span>
           <span 
             key={timeLeft} 
             className={`text-5xl md:text-6xl font-black tabular-nums drop-shadow-sm animate-timer-tick transition-colors leading-none ${isCriticalTime ? 'text-red-500' : 'text-slate-900/10'}`}
           >
              {timeLeft}
           </span>
        </div>
      </div>

      {/* --- Aesthetic Universal D-Pad Joystick (Bottom Left) --- */}
      <div className="joystick-container">
          <div 
            ref={joystickBaseRef}
            className="joystick-base"
            onMouseDown={handleJoystickStart}
            onTouchStart={handleJoystickStart}
          >
            <div className="dir-dot dot-u"></div>
            <div className="dir-dot dot-d"></div>
            <div className="dir-dot dot-l"></div>
            <div className="dir-dot dot-r"></div>
            
            <div 
              className="joystick-knob"
              style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
            />
          </div>
      </div>

      {/* --- Bottom Controls Area --- */}
      <div className="absolute bottom-4 left-0 w-full flex flex-col items-center pointer-events-none gap-2">
        <div className="flex flex-col items-center gap-2 pointer-events-auto relative z-20 max-w-[95vw]">
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200/50 flex gap-3 items-center overflow-x-auto max-w-full no-scrollbar px-3">
                {TEXTURES.map(tex => (
                    <button
                      key={tex.id}
                      onClick={() => onSelectTexture(tex)}
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-[1rem] overflow-hidden transition-all duration-500 group shrink-0 ${currentTexture.id === tex.id ? 'ring-4 ring-slate-900/10 scale-110 shadow-xl' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                    >
                    <img src={tex.src} alt={tex.name} className="w-full h-full object-cover" />
                    {currentTexture.id === tex.id && (
                        <div className="absolute inset-0 bg-slate-900/10 z-10 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
                        </div>
                    )}
                    </button>
                ))}

                <div className="w-[1px] h-8 bg-slate-100 mx-1 shrink-0"></div>

                <label 
                  className="relative w-12 h-12 md:w-14 md:h-14 rounded-[1rem] border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all shrink-0 hover:border-slate-400 active:scale-95 group"
                  title={t.upload}
                >
                    <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                    <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;