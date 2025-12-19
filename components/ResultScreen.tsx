
import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { UI_TEXT } from '../constants';
import { Language, TextureAsset } from '../types';

interface ResultScreenProps {
  lang: Language;
  level1Image: string | null;
  level1Texture: TextureAsset;
  level1Stars: number;
  level2Image?: string | null;
  level2Texture?: TextureAsset;
  level2Stars?: number;
  collectedTextures: TextureAsset[];
  totalTime: number;
  onRestart: () => void;
}

const MATERIAL_HUB_URL = "https://www.paiho.com/tw/material-hub/4fa377fcd9485972e21eba29d63fcffa/";

const ResultScreen: React.FC<ResultScreenProps> = ({ 
    lang, 
    collectedTextures,
    onRestart 
}) => {
  const t = UI_TEXT[lang];
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [userMemo, setUserMemo] = useState('');
  const memoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    QRCode.toDataURL(MATERIAL_HUB_URL, {
      width: 120, margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setQrCodeUrl).catch(console.error);
  }, []);

  // Handle auto-expanding textarea
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserMemo(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleVisitHub = () => {
    window.open(MATERIAL_HUB_URL, '_blank');
  };

  const handleDownloadAll = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1920;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const pad = 100;
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 52px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(t.result_title, pad, pad);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 26px sans-serif'; 
    ctx.fillText('Paiho Ribbon Snake', pad, pad + 80);

    const leftColX = pad;
    const rightColX = W / 2 + 50;
    const topY = pad + 180;
    const colW = W / 2 - pad - 50;

    // Materials Header on Canvas
    ctx.fillStyle = '#334155'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText(t.used_materials, leftColX, topY);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(leftColX, topY + 60); ctx.lineTo(leftColX + colW, topY + 60); ctx.stroke();

    let itemY = topY + 90;
    for (const tex of collectedTextures.slice(0, 8)) {
        const img = new Image(); img.src = tex.src; await new Promise(r => img.onload = r);
        ctx.save();
        ctx.beginPath(); ctx.arc(leftColX + 50, itemY + 50, 50, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, leftColX, itemY, 100, 100);
        ctx.restore();
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(tex.name, leftColX + 130, itemY + 20);
        ctx.fillStyle = '#64748b'; ctx.font = '22px sans-serif'; 
        const desc = lang === Language.ZH ? tex.description_zh : tex.description_en;
        ctx.fillText(desc?.substring(0, 50) + '...', leftColX + 130, itemY + 65);
        itemY += 130;
    }

    // Memo Box on Canvas
    ctx.fillStyle = '#fffbeb'; 
    ctx.fillRect(rightColX, topY, colW, 400);
    ctx.fillStyle = '#78350f'; ctx.font = 'italic 30px cursive, sans-serif';
    ctx.fillText(userMemo || '...', rightColX + 40, topY + 40);

    // QR Area on Canvas
    const qrY = topY + 450;
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(rightColX, qrY, colW, 150);
    if (qrCodeUrl) {
        const qr = new Image(); qr.src = qrCodeUrl; await new Promise(r => qr.onload = r);
        ctx.drawImage(qr, rightColX + 20, qrY + 15, 120, 120);
    }
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(t.hub_label, rightColX + 170, qrY + 45);
    ctx.fillStyle = '#6366f1'; ctx.font = '22px sans-serif'; ctx.fillText('Visit paiho.com →', rightColX + 170, qrY + 90);

    const link = document.createElement('a');
    link.download = `paiho-result.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col items-center p-6 md:p-12 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-5xl flex flex-col animate-fade-in">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 shrink-0 text-center sm:text-left">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none mb-3">
                        {t.result_title}
                    </h2>
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-[15px] md:text-[17px]">
                        Paiho Ribbon Snake
                    </p>
                </div>
                <div className="flex gap-3">
                     <button 
                        onClick={handleDownloadAll}
                        className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 transition-all hover:bg-slate-800 active:scale-95 shadow-none"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span className="text-base tracking-wider">{t.download_all}</span>
                    </button>
                    <button 
                        onClick={onRestart}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:text-slate-800 transition-all active:scale-95 text-base shadow-none"
                    >
                        {t.restart}
                    </button>
                </div>
            </div>

            {/* Content Area - items-stretch equalizes column heights */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                
                {/* Left: Materials */}
                <div className="flex-1 bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col shadow-none">
                    <h3 className="text-[15px] font-black text-slate-300 uppercase tracking-[0.25em] mb-8 border-b border-slate-200 pb-5 shrink-0">
                        {t.used_materials}
                    </h3>
                    <div className="flex flex-col gap-5">
                        {collectedTextures.length > 0 ? collectedTextures.map((tex, idx) => (
                            <div key={`${tex.id}-${idx}`} className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-slate-100 transition-all hover:border-slate-300 shadow-none">
                                <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-slate-50">
                                    <img src={tex.src} alt={tex.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left overflow-hidden">
                                    <p className="font-bold text-slate-700 text-[20px] leading-tight mb-2 truncate">{tex.name}</p>
                                    <p className="text-[16px] text-slate-400 leading-tight font-medium line-clamp-2">
                                        {lang === Language.ZH ? tex.description_zh : tex.description_en}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-slate-300 font-bold text-[18px] italic">Empty palette.</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Memo & QR */}
                <div className="w-full lg:w-[420px] flex flex-col gap-8">
                    
                    {/* Notes Area - Height adapts, auto-expanding pushes column */}
                    <div className="bg-amber-50/40 p-8 rounded-3xl border border-amber-100 flex-grow relative shadow-none">
                        <textarea 
                            ref={memoRef}
                            value={userMemo}
                            onChange={handleMemoChange}
                            placeholder={t.user_memo_placeholder}
                            className="w-full bg-transparent resize-none outline-none text-amber-900 placeholder-amber-200 text-lg font-bold leading-relaxed font-mono overflow-hidden"
                            style={{ height: 'auto' }}
                        />
                        <div className="absolute bottom-5 right-5 text-amber-200/50 pointer-events-none">
                             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Material Hub Area */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-none shrink-0">
                         <div className="w-24 h-24 bg-white p-1 border border-slate-200 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center shadow-none">
                             {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-full h-full opacity-70" />}
                         </div>
                         <div className="text-left flex flex-col justify-center">
                            <p className="font-black text-slate-300 text-[12px] uppercase tracking-widest mb-1.5">LIBRARY ACCESS</p>
                            <button onClick={handleVisitHub} className="text-indigo-500 font-bold text-[18px] hover:underline flex items-center gap-2 group whitespace-nowrap">
                                {t.hub_label} <span className="text-[22px] transition-transform group-hover:translate-x-1.5">→</span>
                            </button>
                         </div>
                    </div>

                </div>
            </div>
      </div>
    </div>
  );
};

export default ResultScreen;
