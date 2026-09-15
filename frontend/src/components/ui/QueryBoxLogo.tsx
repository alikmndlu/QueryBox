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
      {/* Sleek Isometric QueryBox Mark */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
        >
          <defs>
            <linearGradient id="qb-grad-top" x1="12" y1="4" x2="36" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="qb-grad-left" x1="6" y1="16" x2="24" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4338CA" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="qb-grad-right" x1="24" y1="16" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3730A3" />
              <stop offset="1" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="qb-glow" x1="14" y1="18" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Isometric Box Faces */}
          {/* Top Face */}
          <path
            d="M24 4L42 14.5L24 25L6 14.5L24 4Z"
            fill="url(#qb-grad-top)"
            stroke="#A5B4FC"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Left Face */}
          <path
            d="M6 14.5V33.5L24 44V25L6 14.5Z"
            fill="url(#qb-grad-left)"
            stroke="#6366F1"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Right Face */}
          <path
            d="M24 25V44L42 33.5V14.5L24 25Z"
            fill="url(#qb-grad-right)"
            stroke="#4F46E5"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Database Layer Lines Inside Left Face */}
          <path
            d="M6 21L24 31.5M6 27.5L24 38"
            stroke="#6366F1"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />

          {/* Database Layer Lines Inside Right Face */}
          <path
            d="M24 31.5L42 21M24 38L42 27.5"
            stroke="#818CF8"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Glowing Query Prompt Symbol on Top Face (> _) */}
          <path
            d="M17 11.5L21 14.5L17 17.5"
            stroke="#E0E7FF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 17.5H30"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white font-sans">
              Query<span className="text-indigo-400">Box</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/40">
              DESKTOP
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wide">
            SQL Workspace
          </span>
        </div>
      )}
    </div>
  );
};
