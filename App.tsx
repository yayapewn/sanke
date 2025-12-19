import React, { useState, useEffect, useRef } from 'react';
import { GameStage, Language, TextureAsset, LevelConfig, Point } from './types';
import { TEXTURES, LEVEL_CONFIGS } from './constants';
import IntroScreen from './components/IntroScreen';
import GameHUD from './components/GameHUD';
import RibbonCanvas from './components/RibbonCanvas';
import ResultScreen from './components/ResultScreen';
import TechBackground from './components/TechBackground';
import LevelCompleteScreen from './components/LevelCompleteScreen';
import GameOverScreen from './components/GameOverScreen';

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.INTRO);
  const [lang, setLang] = useState<Language>(Language.ZH);
  const [texture, setTexture] = useState<TextureAsset>(TEXTURES[0]);
  const [currentLevel, setCurrentLevel] = useState(1);
  // Adjusted: Half of previous 3.5 -> 1.75 for a thinner, more elegant slither
  const [strokeWidth, setStrokeWidth] = useState<number>(1.75); 
  
  const [progress, setProgress] = useState(0); 
  const [hp, setHp] = useState(5);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameScreenshot, setGameScreenshot] = useState<string | null>(null);
  const [level2Screenshot, setLevel2Screenshot] = useState<string | null>(null);
  const [gameOverReason, setGameOverReason] = useState<'TIME' | 'HP'>('TIME');
  
  const [collectedTextures, setCollectedTextures] = useState<TextureAsset[]>([]);
  const [levelStars, setLevelStars] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [level1Stars, setLevel1Stars] = useState(0);
  const [level2Stars, setLevel2Stars] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const [dpadDir, setDpadDir] = useState<Point | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlaying = stage === GameStage.GAME;

  const currentLevelConfig = LEVEL_CONFIGS[currentLevel];

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouch || /android|iphone|ipad|ipod|windows phone/i.test(userAgent.toLowerCase()));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCollectedTextures(prev => {
      const exists = prev.some(t => t.id === texture.id);
      if (exists) return prev;
      return [...prev, texture];
    });
  }, [texture]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => {
           if (prev <= 1) {
               handleGameOver(false, texture, 'TIME'); 
               return 0;
           }
           return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, texture, currentLevel]);

  const handleStart = () => {
    setCurrentLevel(1);
    setStage(GameStage.GAME);
    setProgress(0);
    setHp(5);
    setTimeLeft(LEVEL_CONFIGS[1].timeLimit);
    setCollectedTextures([texture]); 
    setGameScreenshot(null);
    setLevel2Screenshot(null);
    setLevel1Stars(0);
    setLevel2Stars(0);
    setLevelScore(0);
    setDpadDir(null);
  };

  const handleGameOver = (win: boolean, lastTexture: TextureAsset, reason: 'TIME' | 'HP' = 'TIME') => {
    if (canvasRef.current) {
        try {
            const data = canvasRef.current.toDataURL();
            if (currentLevel === 1) {
                setGameScreenshot(data);
            } else {
                setLevel2Screenshot(data);
            }
        } catch (e) {
            console.error("Screenshot capture failed:", e);
        }
    }

    if (win) {
        const timeRatio = timeLeft / currentLevelConfig.timeLimit;
        
        let stars = 1;
        if (timeRatio > 0.8) stars = 5;
        else if (timeRatio > 0.6) stars = 4;
        else if (timeRatio > 0.4) stars = 3;
        else if (timeRatio > 0.2) stars = 2;

        const calculatedScore = Math.floor(timeRatio * 1000) + 500;
        
        setLevelStars(stars);
        setLevelScore(calculatedScore);
        
        if (currentLevel === 1) setLevel1Stars(stars);
        else setLevel2Stars(stars);
        
        setStage(GameStage.LEVEL_COMPLETE);
    } else {
        setGameOverReason(reason);
        setStage(GameStage.GAME_OVER);
    }
  };

  const handleRetry = () => {
      setProgress(0);
      setHp(5);
      setTimeLeft(currentLevelConfig.timeLimit);
      setStage(GameStage.GAME);
      setDpadDir(null);
  };

  const handleContinueFromComplete = () => {
      if (currentLevel === 1) {
          setCurrentLevel(2);
          setProgress(0);
          setHp(5);
          setTimeLeft(LEVEL_CONFIGS[2].timeLimit);
          setStage(GameStage.GAME);
          setDpadDir(null);
      } else {
          setStage(GameStage.RESULT);
      }
  };

  const handleRestart = () => {
    setStage(GameStage.INTRO);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const newTex: TextureAsset = {
            id: `custom-${Date.now()}`,
            name: 'Custom',
            src: evt.target.result as string,
            width: 20, 
            description_zh: "使用者自定義材質",
            description_en: "Custom Texture"
          };
          setTexture(newTex);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-50 relative overflow-hidden font-sans select-none">
      {stage !== GameStage.INTRO && <TechBackground />}
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.8),_rgba(248,250,252,0.5))] z-0 pointer-events-none" />

      <div className="relative z-10 w-full h-full">
        {stage === GameStage.INTRO && (
          <IntroScreen onStart={handleStart} lang={lang} setLang={setLang} />
        )}

        {isPlaying && (
          <>
            <div className="w-full h-full absolute top-0 left-0 animate-fade-in">
               <RibbonCanvas 
                 key={currentLevel}
                 currentTexture={texture}
                 strokeWidth={strokeWidth}
                 levelConfig={currentLevelConfig}
                 onProgressUpdate={setProgress}
                 onHPUpdate={(newHp) => {
                     setHp(newHp);
                     if (newHp <= 0) handleGameOver(false, texture, 'HP');
                 }}
                 onGameOver={(win, tex) => handleGameOver(win, tex, timeLeft <= 0 ? 'TIME' : 'HP')}
                 isInteractive={true}
                 onCanvasReady={(el) => canvasRef.current = el}
                 dpadDir={dpadDir}
               />
            </div>
            <GameHUD 
              lang={lang}
              level={currentLevel}
              levelConfig={currentLevelConfig}
              progress={progress}
              hp={hp}
              timeLeft={timeLeft}
              currentTexture={texture}
              onSelectTexture={setTexture}
              onNext={() => {}} 
              onUpload={handleFileUpload}
              canUndo={false}
              canRedo={false}
              onUndo={() => {}}
              onRedo={() => {}}
              isMobile={isMobile}
              setDpadDir={setDpadDir}
            />
          </>
        )}

        {stage === GameStage.LEVEL_COMPLETE && (
          <LevelCompleteScreen 
             lang={lang}
             score={levelScore}
             stars={levelStars}
             level={currentLevel}
             texture={texture}
             screenshot={currentLevel === 1 ? gameScreenshot : level2Screenshot}
             onContinue={handleContinueFromComplete}
          />
        )}

        {stage === GameStage.GAME_OVER && (
          <GameOverScreen 
            lang={lang}
            reason={gameOverReason}
            onRetry={handleRetry}
          />
        )}

        {stage === GameStage.RESULT && (
          <ResultScreen 
            lang={lang} 
            level1Image={gameScreenshot}
            level1Texture={texture}
            level1Stars={level1Stars}
            level2Image={level2Screenshot}
            level2Stars={level2Stars}
            collectedTextures={collectedTextures}
            totalTime={LEVEL_CONFIGS[1].timeLimit - timeLeft}
            onRestart={handleRestart} 
          />
        )}
      </div>
    </div>
  );
};

export default App;