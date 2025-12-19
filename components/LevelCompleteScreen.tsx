import React, { useEffect, useState } from 'react';
import { UI_TEXT } from '../constants';
import { Language, TextureAsset } from '../types';

interface LevelCompleteScreenProps {
  lang: Language;
  score: number;
  stars: number;
  level: number;
  texture: TextureAsset;
  screenshot: string | null; 
  onContinue: () => void;
}

const LevelCompleteScreen: React.FC<LevelCompleteScreenProps> = ({ 
  lang, 
  score, 
  stars, 
  onContinue 
}) => {
  const t = UI_TEXT[lang];
  const [displayScore, setDisplayScore] = useState(0);
  const [scale, setScale] = useState(1);

  // Handle Dynamic Scaling
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 500;
      const baseHeight = 700;
      
      const availableWidth = window.innerWidth * 0.9;
      const availableHeight = window.innerHeight * 0.9;
      
      const scaleW = availableWidth / baseWidth;
      const scaleH = availableHeight / baseHeight;
      
      let newScale = Math.min(scaleW, scaleH);
      setScale(Math.max(0.3, Math.min(newScale, 1.2)));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate Score
  useEffect(() => {
    let start = 0;
    const duration = 1000; // ms
    const increment = score / (duration / 16); 
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  // Determine comment
  const getComment = () => {
    if (stars === 5) return t.perfect;
    if (stars === 4) return t.awesome;
    if (stars === 3) return t.good;
    return lang === Language.ZH ? "成功過關" : "Nice Job";
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center animate-fade-in bg-slate-900/40 backdrop-blur-md p-4">
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes star-pop {
          0% { transform: scale(0); }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-star-pop {
          animation: star-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* Main Card */}
      <div 
        className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-white/50 max-w-sm w-full text-center relative overflow-hidden transition-transform duration-500 ease-out flex flex-col items-center justify-center"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        
        {/* Decorative Background Glows */}
        <div className="absolute top-[-40%] left-[-20%] w-64 h-64 bg-indigo-100 rounded-full blur-[80px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-48 h-48 bg-rose-50 rounded-full blur-[60px] opacity-40 pointer-events-none" />

        {/* Header Label */}
        <div className="relative z-10 mb-6">
           <span className="inline-block px-5 py-2 rounded-full bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-[0.25em] border border-slate-200 shadow-sm animate-float">
             {t.level_complete}
           </span>
        </div>

        {/* Hero Visual: Stars Rating */}
        <div className="relative z-10 flex justify-center gap-1.5 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg 
                    key={i} 
                    className={`w-10 h-10 ${i <= stars ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-star-pop' : 'text-slate-100'}`} 
                    style={{ animationDelay: `${i * 0.1}s` }}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>

        {/* Comment Text */}
        <div className="relative z-10 mb-8">
             <h2 className="text-4xl font-black text-slate-800 leading-tight tracking-tighter">
               {getComment()}
             </h2>
        </div>

        {/* Score Stats Row */}
        <div className="relative z-10 mb-10 w-full pt-8 border-t border-dashed border-slate-200">
            <div className="text-center">
                <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest mb-2">{t.score}</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-blue-500 font-mono">
                    {displayScore}
                </p>
            </div>
        </div>

        {/* Rounder, Cuter, Fuller Button */}
        <button 
          onClick={onContinue}
          className="relative z-10 w-full py-5 px-8 bg-[#4F46E5] text-white rounded-full font-black text-xl 
                     shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] 
                     hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.6)] 
                     hover:-translate-y-1.5 hover:scale-[1.03] active:scale-95 transition-all duration-300 
                     flex items-center justify-center gap-3 group overflow-hidden"
        >
          {/* Subtle glossy effect on button */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none" />
          
          <span className="relative z-20 tracking-wider uppercase text-lg">{t.next}</span>
          <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 relative z-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

      </div>
    </div>
  );
};

export default LevelCompleteScreen;