import React, { useState, useEffect } from 'react';
import { QueryBoxLogo } from './QueryBoxLogo';
import { Sparkles, ShieldCheck, Database, Cpu, Zap, Lock, Gauge, CheckCircle2, HardDrive, Terminal } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
}

const CATCHY_TAGLINE = "Elevate Your Databases. Fast, Offline, Absolute Control.";

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [typedText, setTypedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Go Native Engine...');
  const [activeStep, setActiveStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Typewriter effect pacing for catchy tagline
  useEffect(() => {
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < CATCHY_TAGLINE.length) {
        setTypedText(CATCHY_TAGLINE.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, []);

  // Boot telemetry and progress step timing
  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(28);
      setActiveStep(1);
      setStatusText('Initializing Go Native Engine & SQLite Kernel...');
    }, 300);

    const t2 = setTimeout(() => {
      setProgress(58);
      setActiveStep(2);
      setStatusText('Loading Encrypted Storage & Schema Cache...');
    }, 1100);

    const t3 = setTimeout(() => {
      setProgress(88);
      setActiveStep(3);
      setStatusText('Mounting Offline Monaco SQL Engine...');
    }, 2200);

    const t4 = setTimeout(() => {
      setProgress(100);
      setActiveStep(4);
      setStatusText('System Ready. Welcome to QueryBox.');
    }, 3200);

    const t5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 4200);

    const t6 = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 4900);

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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#03050a] select-none transition-all duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-105 blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-Tech Holographic Ambient Background Energy Orbs */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-600/35 via-sky-500/25 to-purple-600/35 blur-[170px] pointer-events-none animate-float-pulse" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-emerald-500/20 blur-[130px] pointer-events-none animate-pulse" />

      {/* Main Apple-Style Glassmorphic Floating Hologram Card */}
      <div className="relative flex flex-col items-center justify-center p-9 rounded-3xl bg-[#080c18]/95 border border-[#1e2d4f] backdrop-blur-3xl shadow-[0_0_100px_rgba(99,102,241,0.35)] max-w-md w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Laser Shimmer Scanline Moving Horizontal Sweep */}
        <div className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent animate-shimmer-scan pointer-events-none" />

        {/* Apple Glass Highlight Top Specular Reflective Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

        {/* Orbiting Neon Pulse Rings surrounding 3D Logo */}
        <div className="relative mb-7 flex items-center justify-center group">
          {/* Outer Clockwise Rotating Gradient Orbit Ring */}
          <div className="absolute -inset-6 rounded-full border-2 border-transparent border-t-indigo-500 border-r-sky-400 border-b-emerald-400 animate-[spin_6s_linear_infinite] opacity-80 blur-[1px]" />
          
          {/* Inner Counter-Clockwise Rotating Orbit Ring */}
          <div className="absolute -inset-3 rounded-full border border-transparent border-l-purple-500 border-t-pink-400 animate-reverse-spin opacity-60" />

          {/* Core Pulsing Glow */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/35 blur-2xl group-hover:bg-indigo-500/60 transition-all duration-500 animate-pulse" />
          
          <QueryBoxLogo
            size={80}
            showText={false}
            className="relative z-10 drop-shadow-[0_16px_40px_rgba(99,102,241,0.75)] transition-transform duration-500 hover:scale-110"
          />
        </div>

        {/* Shimmering Metallic Brand Header */}
        <div className="space-y-1.5 mb-5">
          <h1 className="text-3.5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5 font-sans">
            <span>Query</span>
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent drop-shadow-sm">Box</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              SQL WORKBENCH • PRO EDITION
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-bold uppercase tracking-wider animate-laser-pulse">
              v1.5.0
            </span>
          </div>
        </div>

        {/* Catchy Typewriter Tagline Block */}
        <div className="w-full bg-[#060913]/90 border border-[#1b2642] rounded-2xl p-4 mb-6 text-center shadow-inner relative overflow-hidden group">
          <div className="text-xs font-semibold text-slate-200 tracking-wide min-h-[38px] flex items-center justify-center leading-relaxed">
            <span className="bg-gradient-to-r from-slate-100 via-sky-200 to-indigo-200 bg-clip-text text-transparent font-sans">
              {typedText}
            </span>
            <span className="inline-block w-2 h-4 bg-indigo-400 ml-1.5 animate-pulse rounded-sm shadow-[0_0_8px_#818cf8]" />
          </div>
        </div>

        {/* Step-by-Step Hardware Capability Badges */}
        <div className="grid grid-cols-4 gap-1.5 w-full mb-5">
          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${activeStep >= 1 ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]' : 'bg-[#090d18] border-[#151f36] text-slate-600'}`}>
            <Cpu className="w-3.5 h-3.5 mb-1" />
            <span className="text-[9px] font-mono font-bold">Go Core</span>
          </div>
          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${activeStep >= 2 ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]' : 'bg-[#090d18] border-[#151f36] text-slate-600'}`}>
            <HardDrive className="w-3.5 h-3.5 mb-1" />
            <span className="text-[9px] font-mono font-bold">SQLite</span>
          </div>
          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${activeStep >= 3 ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]' : 'bg-[#090d18] border-[#151f36] text-slate-600'}`}>
            <Terminal className="w-3.5 h-3.5 mb-1" />
            <span className="text-[9px] font-mono font-bold">Monaco</span>
          </div>
          <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${activeStep >= 4 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'bg-[#090d18] border-[#151f36] text-slate-600'}`}>
            <Zap className="w-3.5 h-3.5 mb-1" />
            <span className="text-[9px] font-mono font-bold">0ms Latency</span>
          </div>
        </div>

        {/* Apple-Style Minimalist Progress Bar Track */}
        <div className="w-full h-1.5 rounded-full bg-[#0d1322] border border-[#1b2742] overflow-hidden mb-3.5 p-0.5">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_18px_rgba(56,189,248,0.95)]"
          />
        </div>

        {/* Micro-Telemetry Status Indicator */}
        <div className="h-5 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          {progress < 30 ? (
            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : progress < 60 ? (
            <Database className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          ) : progress < 95 ? (
            <Terminal className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          )}
          <span className="truncate max-w-[260px] text-slate-300 font-medium">{statusText}</span>
        </div>

        {/* Footer Hardware & Security Badges */}
        <div className="mt-5 pt-3.5 border-t border-[#16213b]/80 w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-400 font-medium">100% Local Offline Privacy</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300">Wails + Go Engine</span>
          </span>
        </div>

      </div>
    </div>
  );
};
