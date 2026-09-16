import React from 'react';
import { NavMode } from '../types/photobooth';
import { Sparkles, Mouse, Hand, Check, X } from 'lucide-react';

interface NavigationModalProps {
  isOpen: boolean;
  currentMode: NavMode;
  isSettingsMode?: boolean; // if true, shows a close button
  onSelectMode: (mode: NavMode) => void;
  onClose?: () => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  currentMode,
  isSettingsMode = false,
  onSelectMode,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-6 select-none animate-fadeIn">
      <div className="card-duo max-w-xl w-full p-8 md:p-10 relative shadow-2xl border-4 border-b-8 border-[#E8CEC9] bg-white flex flex-col items-center text-center">
        {/* Close button if opened from settings */}
        {isSettingsMode && onClose && (
          <button
            data-interactive="true"
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-[#FDF7F5] border-2 border-[#E8CEC9] flex items-center justify-center text-[#8B7B78] hover:text-[#D34B4D] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0ED] text-duo-red text-xs font-black uppercase tracking-wider border-2 border-duo-border mb-3">
          <Sparkles className="w-4 h-4 fill-duo-red text-duo-red" />
          <span>Pengaturan Kontrol</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-duo-text tracking-tight mb-2">
          PILIH CARA NAVIGASI
        </h2>
        <p className="text-[#8B7B78] text-sm font-bold max-w-md mb-8 leading-relaxed">
          Pilih metode kontrol yang paling nyaman untuk sesi photobooth kamu. Kamu bisa mengubahnya kapan saja!
        </p>

        {/* 2 Navigation Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          {/* Option 1: Hand Tracking */}
          <div
            data-interactive="true"
            onClick={() => onSelectMode('hand')}
            className={`p-6 rounded-3xl border-3 cursor-pointer transition-all duration-150 flex flex-col items-center text-center relative ${
              currentMode === 'hand'
                ? 'bg-[#FFF0ED] border-duo-red border-b-6 border-b-duo-redDeep shadow-duo-sm translate-y-[-2px]'
                : 'bg-[#FDF7F5] border-[#E8CEC9] border-b-5 border-b-[#D5C2BE] hover:bg-[#FFF7F5] hover:border-duo-red/60 active:translate-y-1'
            }`}
          >
            {currentMode === 'hand' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-duo-red text-white flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}

            <div
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-4 shadow-sm ${
                currentMode === 'hand'
                  ? 'bg-duo-red text-white border-duo-redDeep'
                  : 'bg-white text-duo-red border-[#E8CEC9]'
              }`}
            >
              <Hand className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-duo-text mb-1">
              Gestur Tangan
            </h3>
            <span className="text-[11px] font-black uppercase text-duo-red bg-white px-2.5 py-0.5 rounded-full border border-duo-border mb-2.5">
              Hands-Free Kiosk
            </span>
            <p className="text-[#8B7B78] text-xs font-bold leading-relaxed">
              Kursor mengikuti telapak tangan & kuncupkan jari untuk klik. Tanpa sentuh layar!
            </p>
          </div>

          {/* Option 2: Mouse / Touchpad */}
          <div
            data-interactive="true"
            onClick={() => onSelectMode('mouse')}
            className={`p-6 rounded-3xl border-3 cursor-pointer transition-all duration-150 flex flex-col items-center text-center relative ${
              currentMode === 'mouse'
                ? 'bg-[#FFF0ED] border-duo-red border-b-6 border-b-duo-redDeep shadow-duo-sm translate-y-[-2px]'
                : 'bg-[#FDF7F5] border-[#E8CEC9] border-b-5 border-b-[#D5C2BE] hover:bg-[#FFF7F5] hover:border-duo-red/60 active:translate-y-1'
            }`}
          >
            {currentMode === 'mouse' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-duo-red text-white flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}

            <div
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-4 shadow-sm ${
                currentMode === 'mouse'
                  ? 'bg-duo-red text-white border-duo-redDeep'
                  : 'bg-white text-duo-red border-[#E8CEC9]'
              }`}
            >
              <Mouse className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-duo-text mb-1">
              Mouse / Klik Biasa
            </h3>
            <span className="text-[11px] font-black uppercase text-[#8B7B78] bg-white px-2.5 py-0.5 rounded-full border border-duo-border mb-2.5">
              Standar & Cepat
            </span>
            <p className="text-[#8B7B78] text-xs font-bold leading-relaxed">
              Gunakan mouse atau touchpad biasa. Praktis dan tidak membutuhkan kamera aktif untuk kursor.
            </p>
          </div>
        </div>

        {/* Confirm / Continue Button */}
        <button
          data-interactive="true"
          onClick={() => {
            onSelectMode(currentMode);
            if (onClose) onClose();
          }}
          className="w-full h-15 btn-duo-primary text-lg flex items-center justify-center gap-2 active:scale-98"
        >
          <span>TERAPKAN PILIHAN</span>
        </button>
      </div>
    </div>
  );
};
