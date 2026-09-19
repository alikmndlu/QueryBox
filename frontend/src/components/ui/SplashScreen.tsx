import React, { useState, useEffect } from 'react';
import { QueryBoxLogo } from './QueryBoxLogo';
import { Terminal, Sparkles, ShieldCheck, Database, Cpu, Zap } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
}

const TAGLINE_TO_TYPE = "SELECT * FROM universe WHERE performance = 'MAX' AND privacy = 100;";

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [typedText, setTypedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Go Native Engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Typewriter effect pacing logic
  useEffect(() => {
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < TAGLINE_TO_TYPE.length) {
        setTypedText(TAGLINE_TO_TYPE.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 42);

    return () => clearInterval(typingInterval);
  }, []);

  // Boot telemetry and progress step timing
  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(25);
      setStatusText('Initializing Go Native Engine...');
    }, 200);

    const t2 = setTimeout(() => {
      setProgress(55);
      setStatusText('Loading Encrypted Local SQLite Storage...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(85);
      setStatusText('Mounting Monaco SQL Compiler & Visualizer...');
    }, 1800);

    const t4 = setTimeout(() => {
      setProgress(100);
      setStatusText('System Ready. Launching Workbench...');
    }, 2800);

    const t5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 3600);

    const t6 = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 4300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#04060d] select-none transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-Tech Holographic Ambient Background Energy Fields */}
      <div className="absolute w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-sky-500/20 to-purple-600/30 blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />

      {/* Main Apple-Style Glassmorphic Floating Hologram Card */}
      <div className="relative flex flex-col items-center justify-center p-9 rounded-3xl bg-[#090d18]/90 border border-[#1e2b4a] backdrop-blur-3xl shadow-[0_0_90px_rgba(99,102,241,0.3)] max-w-md w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Apple Glass Highlight Top Specular Reflective Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        {/* Orbiting Neon Pulse Ring surrounding 3D Logo */}
        <div className="relative mb-7 flex items-center justify-center group">
          {/* Rotating Gradient Orbit Ring */}
          <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-indigo-500 border-r-sky-400 border-b-emerald-400 animate-[spin_7s_linear_infinite] opacity-75 blur-[1px]" />
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-2xl group-hover:bg-indigo-500/50 transition-all duration-500 animate-pulse" />
          
          <QueryBoxLogo
            size={76}
            showText={false}
            className="relative z-10 drop-shadow-[0_14px_35px_rgba(99,102,241,0.65)] transition-transform duration-500 hover:scale-110"
          />
        </div>

        {/* Shimmering Metallic Brand Header */}
        <div className="space-y-1 mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5 font-sans">
            <span>Query</span>
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">Box</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              SQL Workbench • Pro Edition
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
              v1.3.5
            </span>
          </div>
        </div>

        {/* Dynamic Typewriter Code Terminal Bar */}
        <div className="w-full bg-[#070a14] border border-[#1d2844] rounded-xl p-3 mb-5 text-left font-mono text-xs shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#162035] text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="ml-1 text-slate-400 font-bold">console.sql</span>
            </div>
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-emerald-300 flex items-center min-h-[22px] break-all leading-relaxed">
            <span className="text-indigo-400 mr-2 font-bold select-none">&gt;</span>
            <span className="text-slate-100">{typedText}</span>
            <span className="inline-block w-2 h-4 bg-sky-400 ml-1 animate-pulse" />
          </div>
        </div>

        {/* Apple-Style Minimalist Progress Bar Track */}
        <div className="w-full h-1.5 rounded-full bg-[#111726] border border-[#1f2b48] overflow-hidden mb-3.5 p-0.5">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(56,189,248,0.8)]"
          />
        </div>

        {/* Micro-Telemetry Status Indicator */}
        <div className="h-5 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          {progress < 30 ? (
            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : progress < 60 ? (
            <Database className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          ) : progress < 95 ? (
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="truncate max-w-[260px] text-slate-300 font-medium">{statusText}</span>
        </div>

        {/* Footer Hardware & Security Badges */}
        <div className="mt-5 pt-3 border-t border-[#17223c]/80 w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>100% Offline &amp; Encrypted</span>
          </span>
          <span className="text-slate-400 font-semibold">Local-First</span>
        </div>

      </div>
    </div>
  );
};
