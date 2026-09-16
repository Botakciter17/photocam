import React from 'react';
import { CursorState } from '../types/gesture';

interface VirtualCursorProps {
  cursor: CursorState;
  isVisible: boolean;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ cursor, isVisible }) => {
  if (!isVisible || !cursor.isHandPresent) {
    return null;
  }

  const isHovering = Boolean(cursor.isHoveringInteractive);
  const radius = isHovering ? 32 : 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - cursor.fistProgress * circumference;

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-all duration-100 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer Halo / Glow Ring with Duolingo Red & Yellow Highlights */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-200 ${
          isHovering
            ? 'w-22 h-22 -left-3 -top-3 bg-amber-400/20 border-2 border-amber-400 animate-pulse'
            : 'w-14 h-14 bg-duo-red/15'
        }`}
      />

      {/* Outer Progress Ring during fist hold */}
      <svg
        className={`transition-all duration-200 -rotate-90 ${isHovering ? 'w-22 h-22' : 'w-16 h-16'}`}
        viewBox="0 0 80 80"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-slate-200/80"
          strokeWidth="6"
          fill="none"
        />
        {cursor.fistProgress > 0 && (
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-duo-red transition-all duration-75"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>

      {/* Central Cursor Point (Chunky 3D Button Style) */}
      <div
        className={`absolute inset-0 m-auto rounded-full flex items-center justify-center transition-all duration-150 border-2 ${
          cursor.isFist
            ? 'w-9 h-9 bg-duo-red border-duo-redDark shadow-[0_4px_0_#A83234] scale-95'
            : isHovering
            ? 'w-8 h-8 bg-duo-yellow border-duo-yellowDark shadow-[0_4px_0_#E5A500] scale-110'
            : 'w-6 h-6 bg-white border-duo-red shadow-[0_3px_0_#D5C2BE]'
        }`}
      >
        <div
          className={`rounded-full transition-colors ${
            cursor.isFist
              ? 'w-3 h-3 bg-white'
              : isHovering
              ? 'w-3 h-3 bg-duo-redDeep'
              : 'w-2 h-2 bg-duo-red'
          }`}
        />
      </div>

      {/* Status Micro-Pill (Duolingo Tooltip Style) */}
      {isHovering && cursor.fistProgress === 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-2xl bg-white text-duo-red font-black text-[11px] uppercase tracking-wider border-2 border-duo-border shadow-duo-gray whitespace-nowrap">
          Kuncupkan Jari
        </div>
      )}

      {cursor.fistProgress > 0 && cursor.fistProgress < 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-2xl bg-duo-red text-white font-black text-[11px] uppercase tracking-wider border-2 border-duo-redDark shadow-duo-sm whitespace-nowrap animate-pulse">
          Tahan...
        </div>
      )}
    </div>
  );
};
