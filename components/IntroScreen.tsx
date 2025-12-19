import React, { useState, useEffect } from 'react';
import { UI_TEXT } from '../constants';
import { Language } from '../types';
import BackgroundSnakes from './BackgroundSnakes';

interface IntroScreenProps {
  onStart: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, lang, setLang }) => {
  const t = UI_TEXT[lang];
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Base design dimensions
      const baseWidth = 1200;
      const baseHeight = 700;
      
      // Calculate available space allowing for 5% top and 5% bottom margin (90% height)
      const availableWidth = window.innerWidth * 0.9;
      const availableHeight = window.innerHeight * 0.9;
      
      const scaleW = availableWidth / baseWidth;
      const scaleH = availableHeight / baseHeight;
      
      // Use the smaller scale factor to ensure it fits both ways
      let newScale = Math.min(scaleW, scaleH);
      
      // Clamp the scale to prevent UI from becoming unreadably small or excessively large
      setScale(Math.max(0.5, Math.min(newScale, 1.3)));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-[#FFFDF9] py-[5vh]">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        @keyframes slither-logo {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-slither {
          stroke-dasharray: 1000;
          animation: slither-logo 3s ease-out forwards;
        }
        @keyframes pop-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop {
          animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
      
      {/* Playful background snakes */}
      <BackgroundSnakes count={6} />

      {/* Main Container with dynamic scale - centered within the 90% vertical safe area */}
      <div 
        className="relative z-10 flex flex-col items-center text-center px-6 transition-transform duration-500 ease-out"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        
        {/* Animated Snake Visual */}
        <div className="mb-6 md:mb-8 relative animate-float-slow">
            <svg width="220" height="130" viewBox="0 0 200 120" fill="none" className="drop-shadow-2xl">
                {/* Ribbon Body - Color changed to orange-500 (#F97316) */}
                <path d="M20 60C20 60 40 20 80 20C120 20 140 100 180 100" stroke="#F97316" strokeWidth="24" strokeLinecap="round" className="animate-slither" />
                <path d="M20 60C20 60 40 20 80 20C120 20 140 100 180 100" stroke="white" strokeWidth="8" strokeLinecap="round" strokeDasharray="10 20" opacity="0.3" />
                
                {/* Snake Head */}
                <circle cx="180" cy="100" r="18" fill="#F97316" />
                <circle cx="188" cy="94" r="3" fill="white" />
                <circle cx="188" cy="106" r="3" fill="white" />
                {/* Tongue */}
                <path d="M198 100H210M210 100L215 95M210 100L215 105" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
            </svg>
            
            {/* Floating Sparkles */}
            <div className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z"/></svg>
            </div>
        </div>

        {/* Title Section */}
        <div className="mb-6 animate-pop" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-6xl md:text-7xl font-black text-[#1E293B] tracking-tight leading-tight mb-2">
               {lang === Language.ZH ? "百和織帶" : "Paiho"} 
               <span className="text-orange-500 ml-2">{lang === Language.ZH ? "貪食蛇" : "Snake"}</span>
            </h1>
            <p className="text-slate-400 text-base font-bold tracking-[0.4em] uppercase">
               Paiho Ribbon Snake
            </p>
        </div>

        {/* Slogan Text Box - No line break in ZH */}
        <div className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-orange-100 shadow-[0_10px_40px_-10px_rgba(249,115,22,0.1)] mb-8 animate-pop w-full max-w-xl" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-600 text-xl md:text-2xl font-bold leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
              {lang === Language.ZH 
                ? "狂吃紗線球變大，小心炸彈一碰就炸！"
                : "Hungry Webbing Snake: Eat yarn balls to grow, dodge bombs!"
              }
            </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-pop" style={{ animationDelay: '0.6s' }}>
          <button 
            onClick={onStart}
            className="group relative w-full py-6 bg-orange-500 text-white rounded-[2rem] 
                       font-black text-2xl tracking-widest shadow-[0_20px_40px_-10px_rgba(249,115,22,0.5)] 
                       hover:bg-orange-600 hover:shadow-[0_25px_50px_-10px_rgba(249,115,22,0.6)] 
                       hover:-translate-y-1.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-4"
          >
            <span>{t.start}</span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
          </button>

          {/* Language Selector */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-full border border-slate-200 backdrop-blur-sm shadow-inner">
             <button 
               onClick={() => setLang(Language.ZH)}
               className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${
                 lang === Language.ZH ? 'bg-white text-orange-500 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               ZH
             </button>
             <button 
               onClick={() => setLang(Language.EN)}
               className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${
                 lang === Language.EN ? 'bg-white text-orange-500 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               EN
             </button>
          </div>
        </div>

      </div>

      <div className="absolute bottom-4 text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em] w-full text-center">
        Designed by Paiho Digital Lab
      </div>
    </div>
  );
};

export default IntroScreen;