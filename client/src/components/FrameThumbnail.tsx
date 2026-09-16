import React from 'react';
import { FrameOption } from '../types/photobooth';

interface FrameThumbnailProps {
  frame: FrameOption;
  isSelected: boolean;
}

export const FrameThumbnail: React.FC<FrameThumbnailProps> = ({ frame, isSelected }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1">
      {/* Mini Vertical Polaroid Photostrip Representation */}
      <div
        className={`w-full h-20 rounded-xl p-1.5 flex flex-col justify-between transition-all duration-200 shadow-sm ${
          frame.theme === 'white-modern'
            ? 'bg-white border-2 border-slate-300'
            : frame.theme === 'film-strip'
            ? 'bg-slate-900 border-2 border-slate-700'
            : frame.theme === 'retro-neon'
            ? 'bg-[#090D16] border-2 border-cyan-500/50'
            : 'bg-slate-900 border-2 border-amber-500/50'
        }`}
      >
        {/* 3 Stacked Landscape Photo Slots */}
        <div className="flex-1 flex flex-col justify-between py-0.5 gap-1">
          {/* Slot 1 */}
          <div
            className={`w-full h-4 rounded-md transition-colors ${
              frame.theme === 'white-modern'
                ? 'bg-slate-200 border border-slate-300'
                : frame.theme === 'film-strip'
                ? 'bg-slate-800 border border-amber-500/40'
                : frame.theme === 'retro-neon'
                ? 'bg-slate-950 border border-cyan-400'
                : 'bg-slate-950 border border-amber-400'
            }`}
          />
          {/* Slot 2 */}
          <div
            className={`w-full h-4 rounded-md transition-colors ${
              frame.theme === 'white-modern'
                ? 'bg-slate-200 border border-slate-300'
                : frame.theme === 'film-strip'
                ? 'bg-slate-800 border border-amber-500/40'
                : frame.theme === 'retro-neon'
                ? 'bg-slate-950 border border-pink-500'
                : 'bg-slate-950 border border-amber-400'
            }`}
          />
          {/* Slot 3 */}
          <div
            className={`w-full h-4 rounded-md transition-colors ${
              frame.theme === 'white-modern'
                ? 'bg-slate-200 border border-slate-300'
                : frame.theme === 'film-strip'
                ? 'bg-slate-800 border border-amber-500/40'
                : frame.theme === 'retro-neon'
                ? 'bg-slate-950 border border-cyan-400'
                : 'bg-slate-950 border border-amber-400'
            }`}
          />
        </div>

        {/* Polaroid Footer Chin */}
        <div className="pt-1 flex items-center justify-center">
          <span
            className={`text-[8px] font-black uppercase tracking-wider truncate leading-none ${
              frame.theme === 'white-modern'
                ? 'text-slate-800'
                : frame.theme === 'film-strip'
                ? 'text-amber-400'
                : frame.theme === 'retro-neon'
                ? 'text-pink-400'
                : 'text-amber-300 font-serif'
            }`}
          >
            {frame.theme === 'white-modern'
              ? 'Polaroid'
              : frame.theme === 'film-strip'
              ? '35mm Film'
              : frame.theme === 'retro-neon'
              ? 'Neon'
              : 'Gold'}
          </span>
        </div>
      </div>
    </div>
  );
};
