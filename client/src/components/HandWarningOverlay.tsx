import React from 'react';
import { Hand, Sparkles } from 'lucide-react';

interface HandWarningOverlayProps {
  show: boolean;
  secondsRemaining?: number;
}

export const HandWarningOverlay: React.FC<HandWarningOverlayProps> = ({
  show,
  secondsRemaining,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9000] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="card-duo p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center shadow-2xl border-4 border-b-8 border-duo-red animate-ring-pulse">
        {/* Playful Chunky Hand Badge */}
        <div className="w-20 h-20 rounded-3xl bg-duo-redLight border-4 border-duo-red flex items-center justify-center mb-4 text-duo-red shadow-duo-sm">
          <Hand className="w-10 h-10 animate-bounce stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-duo-yellow/20 text-duo-yellowDark text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Yuk Bersiap!</span>
        </div>

        <h3 className="text-2xl font-black text-duo-text mb-2 tracking-tight">
          Tangan Kamu Mana?
        </h3>
        <p className="text-duo-muted text-sm font-bold mb-5 leading-relaxed">
          Angkat telapak tangan ke depan kamera untuk melanjutkan sesi foto kamu!
        </p>

        {typeof secondsRemaining === 'number' && (
          <div className="w-full py-2 px-4 rounded-2xl bg-duo-bg border-2 border-duo-border text-xs font-extrabold text-duo-muted">
            Reset otomatis dalam <span className="text-duo-red font-black">{secondsRemaining}</span> detik
          </div>
        )}
      </div>
    </div>
  );
};
