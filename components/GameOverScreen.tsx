import React, { useState, useEffect } from 'react';
import { UI_TEXT } from '../constants';
import { Language } from '../types';

interface GameOverScreenProps {
  lang: Language;
  reason: 'TIME' | 'HP';
  onRetry: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ lang, reason, onRetry }) => {
  const t = UI_TEXT[lang];
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Base design dimensions for the card
      const baseWidth = 500;
      const baseHeight = 600;
      
      // Calculate available space allowing for exactly 3% top and 3% bottom margin (94% height available)
      const availableWidth = window.innerWidth * 0.94;
      const availableHeight = window.innerHeight * 0.94;
      
      const scaleW = availableWidth / baseWidth;
      const scaleH = availableHeight / baseHeight;
      
      // Use the smaller scale factor to ensure the entire card fits within the 94% bounds
      let newScale = Math.min(scaleW, scaleH);
      
      // Support very small landscape devices by lowering min clamp
      setScale(Math.max(0.3, Math.min(newScale, 1.2)));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-hidden">
      <div 
        className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/20 max-w-sm w-full flex flex-col items-center justify-center text-center relative transition-transform duration-500 ease-out"
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center',
          maxHeight: 'none' 
        }}
      >
        
        {/* Decorative Background Glow */}
        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-100 rounded-full blur-[80px] opacity-40 pointer-events-none" />

        <div className="relative z-10 mb-8 flex flex-col items-center">
           <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 border-2 border-rose-100 shadow-inner">
               <svg className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
           </div>
           <h2 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter mb-3">
             {t.game_over}
           </h2>
           <div className="h-[2px] w-12 bg-rose-200 mb-4" />
           <p className="text-slate-400 font-bold text-xl md:text-2xl">
             {reason === 'TIME' ? t.time_up : t.out_of_hp}
           </p>
        </div>

        <button 
          onClick={onRetry}
          className="relative z-10 w-full py-6 bg-rose-500 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_40px_-10px_rgba(244,63,94,0.5)] hover:bg-rose-600 hover:shadow-[0_25px_50px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-2 active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-180 transition-transform duration-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          </div>
          <span className="tracking-widest uppercase">{t.retry}</span>
        </button>

      </div>
    </div>
  );
};

export default GameOverScreen;