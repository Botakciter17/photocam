import React from 'react';
import { NavMode } from '../types/photobooth';
import { Play, Hand, MousePointerClick, QrCode, Mouse } from 'lucide-react';

interface MainMenuViewProps {
  navMode: NavMode;
  onStart: () => void;
  onOpenSettings: () => void;
}

const MainMenuViewComponent: React.FC<MainMenuViewProps> = ({
  navMode,
  onStart,
  onOpenSettings
}) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden select-none p-6 gap-6">
      {/* 1. Header Bar */}
      <header className="h-16 px-8 rounded-2xl bg-white border-2 border-b-4 border-[#E8CEC9] flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center">
          <span className="font-black text-2xl tracking-tight text-duo-red">
            PHOTO<span className="text-[#FFC800]">CAM</span>
          </span>
        </div>

        {/* Navigation Mode Setting Trigger (Desktop only) */}
        {navMode !== 'touch' && (
          <button
            data-interactive="true"
            onClick={onOpenSettings}
            className="btn-duo-secondary px-4 py-2 text-xs font-black flex items-center gap-2 hover:border-duo-red transition-all"
            title="Ubah Mode Navigasi"
          >
            <span>{navMode === 'hand' ? 'Navigasi: Gestur Tangan' : 'Navigasi: Mouse'}</span>
            <span className="bg-[#FFF0ED] text-duo-red px-2 py-0.5 rounded-lg border border-duo-border text-[10px] uppercase font-black">
              Ubah
            </span>
          </button>
        )}
      </header>

      {/* 2. Main Hero Content (Duolingo Style 3D Card) */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="card-duo max-w-3xl w-full p-8 md:p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          <h1 className="text-4xl md:text-5xl font-black text-duo-text tracking-tight mb-3">
            FOTO SERU <span className="text-duo-red">DI PHOTOBOOTH!</span>
          </h1>

          <p className="text-[#8B7B78] text-base font-bold max-w-lg mb-8 leading-relaxed">
            {navMode === 'hand'
              ? 'Abadikan momen terbaikmu dengan strip polaroid kekinian. Cukup arahkan tangan & kuncupkan jari untuk navigasi!'
              : navMode === 'mouse'
              ? 'Abadikan momen terbaikmu dengan strip polaroid kekinian. Kontrol mudah dan cepat menggunakan klik mouse!'
              : 'Abadikan momen terbaikmu dengan strip polaroid kekinian. Ketuk layar untuk mulai berfoto!'}
          </p>

          {/* 3 Step Mini-Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full max-w-2xl mb-8">
            <div className="bg-[#FDF7F5] p-4 rounded-2xl border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] flex items-center md:flex-col gap-3 text-left md:text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-duo-border flex items-center justify-center text-duo-red shadow-sm">
                {navMode === 'mouse' ? (
                  <Mouse className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <Hand className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-duo-text uppercase tracking-wide">
                  {navMode === 'mouse' ? '1. Gerakkan Mouse' : '1. Buka Tangan'}
                </h4>
                <p className="text-[11px] font-bold text-[#8B7B78] mt-0.5">
                  {navMode === 'mouse' ? 'Arahkan kursor ke tombol' : 'Gerakkan kursor di layar'}
                </p>
              </div>
            </div>

            <div className="bg-[#FDF7F5] p-4 rounded-2xl border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] flex items-center md:flex-col gap-3 text-left md:text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-duo-border flex items-center justify-center text-duo-red shadow-sm">
                <MousePointerClick className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-duo-red uppercase tracking-wide">
                  {navMode === 'mouse' ? '2. Klik Pilihan' : '2. Kuncupkan Jari'}
                </h4>
                <p className="text-[11px] font-bold text-[#8B7B78] mt-0.5">
                  {navMode === 'mouse' ? 'Klik langsung pada pilihan' : 'Tahan sekejap untuk klik'}
                </p>
              </div>
            </div>

            <div className="bg-[#FDF7F5] p-4 rounded-2xl border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] flex items-center md:flex-col gap-3 text-left md:text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-duo-border flex items-center justify-center text-duo-red shadow-sm">
                <QrCode className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-duo-text uppercase tracking-wide">3. Scan QR</h4>
                <p className="text-[11px] font-bold text-[#8B7B78] mt-0.5">Simpan polaroid ke HP</p>
              </div>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            data-interactive="true"
            onClick={onStart}
            className="w-full max-w-md h-20 btn-duo-primary text-2xl flex items-center justify-center gap-4 active:scale-98 shadow-duo-lg"
          >
            <Play className="w-8 h-8 fill-current stroke-[2]" />
            <span>MULAI FOTO SEKARANG</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export const MainMenuView = React.memo(MainMenuViewComponent);
