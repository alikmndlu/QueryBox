import React from 'react';

interface QueryBoxLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const QueryBoxLogo: React.FC<QueryBoxLogoProps> = ({
  size = 28,
  className = '',
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision 3D Faceted QueryBox Mark */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0 group/logo"
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(99,102,241,0.45)] transition-transform duration-300 group-hover/logo:scale-105"
        >
          <defs>
            {/* Top Crystal Face Gradient */}
            <linearGradient id="qbx-top" x1="16" y1="6" x2="48" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5B4FC" />
              <stop offset="0.4" stopColor="#6366F1" />
              <stop offset="1" stopColor="#4338CA" />
            </linearGradient>

            {/* Left Data Slab Face Gradient */}
            <linearGradient id="qbx-left" x1="8" y1="20" x2="32" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" />
              <stop offset="0.6" stopColor="#3730A3" />
              <stop offset="1" stopColor="#1E1B4B" />
            </linearGradient>

            {/* Right Terminal Face Gradient */}
            <linearGradient id="qbx-right" x1="32" y1="20" x2="56" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#312E81" />
              <stop offset="0.5" stopColor="#1E1B4B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>

            {/* Electric Neon Accent Gradient */}
            <linearGradient id="qbx-neon" x1="18" y1="12" x2="46" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#818CF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>

            {/* Glowing Query Prompt Gradient */}
            <linearGradient id="qbx-prompt" x1="22" y1="14" x2="42" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E0E7FF" />
            </linearGradient>

            {/* Ambient Base Shadow Filter */}
            <radialGradient id="qbx-base-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Underlying Ambient Energy Sphere */}
          <ellipse cx="32" cy="46" rx="22" ry="7" fill="url(#qbx-base-glow)" />

          {/* Left Isometric Face */}
          <path
            d="M8 18.5L32 32V57.5L8 44V18.5Z"
            fill="url(#qbx-left)"
            stroke="#6366F1"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Right Isometric Face */}
          <path
            d="M32 32L56 18.5V44L32 57.5V32Z"
            fill="url(#qbx-right)"
            stroke="#4338CA"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Left Face - Database Shelf Layers */}
          <path
            d="M8 27L32 40.5M8 35.5L32 49"
            stroke="#818CF8"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />

          {/* Right Face - Laser Data Grid Matrix */}
          <path
            d="M32 40.5L56 27M32 49L56 35.5"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Right Face - Internal Neon Pulse Indicator */}
          <circle cx="44" cy="38" r="1.5" fill="#38BDF8" opacity="0.8" />
          <circle cx="50" cy="34" r="1.5" fill="#818CF8" opacity="0.8" />
          <circle cx="38" cy="42" r="1.5" fill="#C084FC" opacity="0.8" />

          {/* Top Crystal Face */}
          <path
            d="M32 5.5L56 18.5L32 32L8 18.5L32 5.5Z"
            fill="url(#qbx-top)"
            stroke="#C7D2FE"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Inner Light Inset Line on Top Face */}
          <path
            d="M32 8.5L52 19.5L32 30L12 19.5L32 8.5Z"
            stroke="#E0E7FF"
            strokeWidth="0.6"
            strokeOpacity="0.4"
            strokeLinejoin="round"
          />

          {/* Prominent SQL Console Prompt on Top Face (> _) */}
          <path
            d="M23 15.5L28 19L23 22.5"
            stroke="url(#qbx-prompt)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M32 23H41"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* High-Tech Diamond Corner Accents */}
          <circle cx="32" cy="5.5" r="1.5" fill="#FFFFFF" />
          <circle cx="8" cy="18.5" r="1.2" fill="#818CF8" />
          <circle cx="56" cy="18.5" r="1.2" fill="#818CF8" />
          <circle cx="32" cy="57.5" r="1.2" fill="#6366F1" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white font-sans flex items-center">
              Query<span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300 bg-clip-text text-transparent">Box</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              v1.0
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            SQL Workbench
          </span>
        </div>
      )}
    </div>
  );
};
