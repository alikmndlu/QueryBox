import React, { useState, useEffect } from 'react';
import { QueryBoxLogo } from './QueryBoxLogo';
import { Sparkles, ShieldCheck, Database, Cpu } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Go Native Engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Step-by-step Apple-style loading progress simulation
    const t1 = setTimeout(() => {
      setProgress(35);
      setStatusText('Loading Encrypted Local Database...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Syncing Workspace Collections & Profiles...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready');
    }, 1400);

    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1700);

    const t5 = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#060911] select-none transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Apple-Style Ambient Radial Glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-sky-500/15 to-purple-600/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Splash Container */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-[#0b0f1a]/80 border border-[#1e2a45]/80 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Animated 3D Logo Mark with Breathing Pulsing Halo */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/30 transition-all duration-500 animate-pulse" />
          <QueryBoxLogo size={64} showText={false} className="relative z-10 drop-shadow-[0_10px_25px_rgba(99,102,241,0.5)] transition-transform duration-500 hover:scale-105" />
        </div>

        {/* Brand Title */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5 font-sans">
            <span>Query</span>
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">Box</span>
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            SQL Workbench • Pro Edition
          </p>
        </div>

        {/* Apple-Style Minimalist Progress Bar */}
        <div className="w-60 h-1.5 rounded-full bg-[#141b2e] border border-[#222f4c] overflow-hidden mb-3 p-0.5">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(56,189,248,0.6)]"
          />
        </div>

        {/* Micro-Status Micro-Message & Icon Indicator */}
        <div className="h-5 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
          {progress < 35 ? (
            <Cpu className="w-3 h-3 text-indigo-400 animate-spin" />
          ) : progress < 75 ? (
            <Database className="w-3 h-3 text-sky-400 animate-pulse" />
          ) : progress < 100 ? (
            <Sparkles className="w-3 h-3 text-amber-400 animate-bounce" />
          ) : (
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          )}
          <span className="truncate max-w-[220px]">{statusText}</span>
        </div>

        {/* Footer Version Tag */}
        <div className="mt-6 pt-3 border-t border-[#182238]/60 w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Local-First Core</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
            v1.3.0
          </span>
        </div>
      </div>
    </div>
  );
};
