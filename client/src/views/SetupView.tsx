import React, { useRef, useEffect } from 'react';
import { ShotCount, DelaySeconds, FilterType, FrameOption, NavMode } from '../types/photobooth';
import { AVAILABLE_FRAMES } from '../types/frames';
import { getFilterCss } from '../utils/canvasCompositor';
import { FrameThumbnail } from '../components/FrameThumbnail';
import { Sparkles, Play, Check, Clock } from 'lucide-react';

interface SetupViewProps {
  stream: MediaStream | null;
  shotCount: ShotCount;
  delay: DelaySeconds;
  filter: FilterType;
  selectedFrame: FrameOption;
  navMode: NavMode;
  isCameraReady: boolean;
  onUpdateShotCount: (count: ShotCount) => void;
  onUpdateDelay: (delay: DelaySeconds) => void;
  onUpdateFilter: (filter: FilterType) => void;
  onUpdateFrame: (frame: FrameOption) => void;
  onBackToMenu: () => void;
  onOpenSettings?: () => void;
  onStartSession: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  stream,
  shotCount,
  delay,
  filter,
  selectedFrame,
  navMode,
  isCameraReady,
  onUpdateShotCount,
  onUpdateDelay,
  onUpdateFilter,
  onUpdateFrame,
  onBackToMenu,
  onOpenSettings,
  onStartSession
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [stream]);

  const shotOptions: ShotCount[] = [1, 2, 3, 4];
  const delayOptions: { value: DelaySeconds; label: string }[] = [
    { value: 3, label: '3 Detik' },
    { value: 5, label: '5 Detik' },
    { value: 10, label: '10 Detik' }
  ];
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'bw', label: 'B&W' },
    { value: 'vintage', label: 'Vintage' }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden select-none">
      {/* 1. Top Header Bar (Duolingo Style) */}
      <header className="h-16 px-8 border-b-2 border-[#E8CEC9] bg-white flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            data-interactive="true"
            onClick={onBackToMenu}
            className="btn-duo-secondary px-4 py-2 text-xs font-black"
            title="Kembali ke Menu Utama"
          >
            <span>Kembali</span>
          </button>

          <span className="font-black text-xl tracking-tight text-duo-red">
            PHOTO<span className="text-[#FFC800]">CAM</span>
          </span>
        </div>

        <div className="bg-[#FFF3F1] border-2 border-duo-border px-4 py-1.5 rounded-2xl text-xs font-black text-duo-red uppercase tracking-wider">
          <span>Atur Sesi Foto</span>
        </div>

        {navMode !== 'touch' && onOpenSettings ? (
          <button
            data-interactive="true"
            onClick={onOpenSettings}
            className="btn-duo-secondary px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:border-duo-red transition-all"
            title="Ubah Mode Navigasi"
          >
            <span>{navMode === 'hand' ? 'Gestur Tangan' : 'Mouse'}</span>
            <span className="bg-[#FFF0ED] text-duo-red px-2 py-0.5 rounded-lg border border-duo-border text-[10px] uppercase font-black">
              Ubah
            </span>
          </button>
        ) : (
          <div className="text-xs font-black text-[#46A302] bg-[#EFFFE0] border-2 border-[#B4F087] px-3.5 py-1.5 rounded-2xl shadow-sm">
            <span>Siap</span>
          </div>
        )}
      </header>

      {/* 2. Main Split Area: 65% Camera Preview | 35% Chunky 3D Controls */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6">
        {/* Left: Camera Feed in Chunky 3D Card */}
        <section className="flex-[62] flex items-center justify-center">
          <div className="relative w-full h-full max-h-[82vh] aspect-video rounded-[2rem] overflow-hidden bg-white border-4 border-b-8 border-[#E8CEC9] shadow-xl flex items-center justify-center">
            {/* Live Mirrored Camera Feed with Filter */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ filter: getFilterCss(filter) }}
              className="w-full h-full object-cover -scale-x-100 transition-all duration-300"
            />

            {/* Real-time Overlay Frame */}
            <img
              src={selectedFrame.overlayPath}
              alt="Frame Overlay"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />

            {/* Duolingo Pill Badge: Settings Summary */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-b-4 border-[#E8CEC9] text-xs font-black text-[#4B3F3D] shadow-md">
              <Sparkles className="w-4 h-4 text-[#FFC800] fill-[#FFC800]" />
              <span>{shotCount} Foto</span>
              <span className="text-slate-300">•</span>
              <span>Jeda {delay}s</span>
              <span className="text-slate-300">•</span>
              <span className="capitalize text-duo-red">{filter}</span>
            </div>
          </div>
        </section>

        {/* Right: Duolingo Chunky Controls */}
        <section className="flex-[38] bg-white rounded-[2rem] border-4 border-b-8 border-[#E8CEC9] p-6 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-5">
            {/* 1. Shot Count Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                <span>Mau foto berapa kali?</span>
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {shotOptions.map((count) => {
                  const isSelected = shotCount === count;
                  return (
                    <button
                      key={count}
                      data-interactive="true"
                      onClick={() => onUpdateShotCount(count)}
                      className={`h-14 rounded-2xl font-black text-xl flex items-center justify-center cursor-pointer ${
                        isSelected ? 'btn-select-active' : 'btn-select-inactive'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Delay Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                <Clock className="w-3.5 h-3.5 text-[#D34B4D]" />
                <span>Jeda per jepretan</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {delayOptions.map((opt) => {
                  const isSelected = delay === opt.value;
                  return (
                    <button
                      key={opt.value}
                      data-interactive="true"
                      onClick={() => onUpdateDelay(opt.value)}
                      className={`h-12 rounded-2xl font-black text-sm flex items-center justify-center cursor-pointer ${
                        isSelected ? 'btn-select-active' : 'btn-select-inactive'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Filter Selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                <span>Filter Warna</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {filterOptions.map((opt) => {
                  const isSelected = filter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      data-interactive="true"
                      onClick={() => onUpdateFilter(opt.value)}
                      className={`h-12 rounded-2xl font-black text-sm flex items-center justify-center cursor-pointer ${
                        isSelected ? 'btn-select-active' : 'btn-select-inactive'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Frame Selector Strip */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                <span>Pilih Frame Polaroid</span>
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {AVAILABLE_FRAMES.map((f) => {
                  const isSelected = selectedFrame.id === f.id;
                  return (
                    <button
                      key={f.id}
                      data-interactive="true"
                      onClick={() => onUpdateFrame(f)}
                      className={`relative rounded-2xl p-1 bg-[#FFFFFF] border-2 transition-all duration-100 cursor-pointer ${
                        isSelected
                          ? 'border-[#D34B4D] border-b-6 border-b-[#7E2123] shadow-md scale-105 ring-2 ring-[#D34B4D]/30'
                          : 'border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] hover:border-[#D34B4D] opacity-90 hover:opacity-100'
                      }`}
                      title={f.name}
                    >
                      <FrameThumbnail frame={f} isSelected={isSelected} />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#D34B4D] text-white flex items-center justify-center shadow-md z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#4B3F3D] mt-2 font-bold truncate">
                Frame: <span className="text-[#D34B4D] font-black">{selectedFrame.name}</span>
              </p>
            </div>
          </div>

          {/* 5. Big 3D Duolingo CTA */}
          <div className="mt-6 pt-4 border-t-2 border-[#F0D5D2]">
            <button
              data-interactive="true"
              onClick={onStartSession}
              disabled={!isCameraReady}
              className="w-full h-16 btn-duo-primary text-xl flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>MULAI SESI FOTO</span>
            </button>
            <p className="text-center text-[11px] text-[#8B7B78] font-bold mt-2">
              Arahkan kursor & kuncupkan jari pada tombol
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
