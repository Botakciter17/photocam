import React, { useState, useEffect } from 'react';
import { ShotCount, FrameOption, FilterType } from '../types/photobooth';
import { AVAILABLE_FRAMES } from '../types/frames';
import { createCompositePhoto } from '../utils/canvasCompositor';
import { createAnimatedBtsGif } from '../utils/btsGenerator';
import { FrameThumbnail } from '../components/FrameThumbnail';
import { RotateCcw, ArrowRight, Sparkles, Check, CheckCircle2, Image as ImageIcon, Film } from 'lucide-react';

interface PreviewViewProps {
  photos: string[];
  btsFramesPerShot?: string[][];
  shotCount: ShotCount;
  selectedFrame: FrameOption;
  selectedFilter: FilterType;
  isSaving?: boolean;
  onUpdateFrame: (frame: FrameOption) => void;
  onUpdateFilter: (filter: FilterType) => void;
  onRetakeSingle: (index: number) => void;
  onRetakeAll: () => void;
  onConfirm: (compositeDataUrl: string) => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  photos,
  btsFramesPerShot = [[], [], [], []],
  shotCount,
  selectedFrame,
  selectedFilter,
  isSaving = false,
  onUpdateFrame,
  onUpdateFilter,
  onRetakeSingle,
  onRetakeAll,
  onConfirm
}) => {
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'photo' | 'gif'>('gif');
  const [isCompositing, setIsCompositing] = useState<boolean>(true);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'bw', label: 'B&W' },
    { value: 'vintage', label: 'Vintage' }
  ];

  // 1. Re-composite Polaroid Strip whenever frame or filter is changed
  useEffect(() => {
    let isMounted = true;
    setIsCompositing(true);

    createCompositePhoto(photos, shotCount, selectedFrame, selectedFilter)
      .then((url) => {
        if (isMounted) {
          setCompositeUrl(url);
          setIsCompositing(false);
        }
      })
      .catch((err) => {
        console.error('Composite generation error:', err);
        if (isMounted) setIsCompositing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [photos, shotCount, selectedFrame, selectedFilter]);

  // 2. Pre-generate Animated BTS Polaroid Strip GIF for real-time live motion preview
  useEffect(() => {
    let isMounted = true;

    if (photos.length > 0) {
      createAnimatedBtsGif(photos, btsFramesPerShot, shotCount, selectedFrame, selectedFilter)
        .then((res) => {
          if (isMounted) {
            setGifPreviewUrl(res.dataUrl);
          }
        })
        .catch((err) => {
          console.error('BTS GIF preview generation error:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [photos, btsFramesPerShot, shotCount, selectedFrame, selectedFilter]);

  return (
    <div className="flex flex-col h-full w-full bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden select-none p-6 gap-6">
      {/* 1. Top Bar */}
      <header className="h-16 px-8 rounded-2xl bg-white border-2 border-b-4 border-[#E8CEC9] flex items-center justify-between z-20 shadow-sm">
        <button
          data-interactive="true"
          onClick={onRetakeAll}
          className="btn-duo-secondary px-4 py-2 text-xs font-black"
        >
          <span>Ulang dari Awal</span>
        </button>

        <div className="bg-[#FFF3F1] border-2 border-duo-border px-5 py-1.5 rounded-full text-xs font-black text-duo-red uppercase tracking-wider">
          <span>Hasil Foto Kamu</span>
        </div>

        <div className="text-xs font-black text-white bg-duo-red px-4 py-1.5 rounded-2xl shadow-duo-sm border-2 border-duo-redDark">
          {shotCount} Jepretan Selesai!
        </div>
      </header>

      {/* 2. Main Content Split: Left (Result Strip / GIF Preview) | Right (Controls & Retake) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden gap-6">
        {/* Left Column: Result Preview with Tab Switcher */}
        <section className="flex-[48] flex flex-col items-center justify-center">
          {/* Tab Switcher: Polaroid Strip vs Animated BTS GIF */}
          <div className="flex gap-2 p-1.5 bg-white rounded-2xl border-2 border-[#E8CEC9] mb-3 shadow-sm">
            <button
              data-interactive="true"
              onClick={() => setActiveTab('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-duo-red text-white shadow-sm'
                  : 'text-[#8B7B78] hover:text-duo-red'
              }`}
            >
              <ImageIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Polaroid Strip</span>
            </button>

            <button
              data-interactive="true"
              onClick={() => setActiveTab('gif')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'gif'
                  ? 'bg-duo-red text-white shadow-sm'
                  : 'text-[#8B7B78] hover:text-duo-red'
              }`}
            >
              <Film className="w-4 h-4 stroke-[2.5]" />
              <span>Animasi GIF (Bergerak)</span>
            </button>
          </div>

          {/* Preview Canvas / GIF Box */}
          <div className="relative w-full h-full max-h-[74vh] rounded-[2.5rem] bg-white border-4 border-b-8 border-[#E8CEC9] shadow-xl flex items-center justify-center p-4">
            {activeTab === 'photo' && (
              <>
                {isCompositing ? (
                  <div className="flex flex-col items-center gap-3 text-duo-red">
                    <div className="w-12 h-12 border-4 border-duo-red border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-black tracking-wide">
                      Memperbarui strip polaroid kamu...
                    </span>
                  </div>
                ) : compositeUrl ? (
                  <img
                    src={compositeUrl}
                    alt="Result Strip Composite"
                    className="h-full max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
                  />
                ) : (
                  <span className="text-duo-red font-black text-sm">Gagal membuat preview foto</span>
                )}
              </>
            )}

            {activeTab === 'gif' && (
              <>
                {gifPreviewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={gifPreviewUrl}
                      alt="Animated BTS Polaroid Strip"
                      className="h-full max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
                    />
                    <span className="text-xs font-black text-duo-red bg-duo-redLight px-3 py-1 rounded-full border border-duo-border">
                      Animasi Gerakan Dibalik Layar (Live Looping)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-duo-red">
                    <div className="w-10 h-10 border-4 border-duo-red border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-duo-muted">Menyiapkan animasi GIF...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Right Column: Retake Selector, Frame/Filter Switcher, Continue Buttons */}
        <section className="flex-[52] bg-white rounded-[2.5rem] border-4 border-b-8 border-[#E8CEC9] p-6 flex flex-col justify-between overflow-y-auto shadow-xl">
          <div className="space-y-5">
            {/* Header Text */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-duo-red bg-duo-redLight px-3 py-1 rounded-full mb-2">
                <Sparkles className="w-4 h-4 fill-duo-red text-duo-red" />
                <span>Keren Banget!</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-duo-text tracking-tight">
                Udah oke belum?
              </h3>
              <p className="text-[#8B7B78] text-xs font-bold mt-1">
                Kamu bisa klik tab di kiri untuk melihat foto polaroid atau animasi GIF bergeraknya!
              </p>
            </div>

            {/* Retake Single Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                Retake jepretan ke-
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {photos.slice(0, shotCount).map((_, idx) => (
                  <button
                    key={idx}
                    data-interactive="true"
                    onClick={() => onRetakeSingle(idx)}
                    className="h-14 rounded-2xl bg-white hover:bg-[#FFF2F0] text-[#D34B4D] font-black text-base border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] hover:border-[#D34B4D] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-1"
                    title={`Retake jepretan ke-${idx + 1}`}
                  >
                    <RotateCcw className="w-4 h-4 stroke-[3]" />
                    <span>#{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Reselect */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                Ganti Frame Polaroid
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {AVAILABLE_FRAMES.map((f) => {
                  const isSelected = selectedFrame.id === f.id;
                  return (
                    <button
                      key={f.id}
                      data-interactive="true"
                      onClick={() => onUpdateFrame(f)}
                      className={`relative rounded-2xl p-1 bg-white border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#D34B4D] border-b-5 border-b-[#7E2123] shadow-md scale-105 ring-2 ring-[#D34B4D]/30'
                          : 'border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] hover:border-[#D34B4D] opacity-90 hover:opacity-100'
                      }`}
                      title={f.name}
                    >
                      <FrameThumbnail frame={f} isSelected={isSelected} />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#D34B4D] text-white flex items-center justify-center shadow-sm z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Reselect */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#4B3F3D] mb-2.5">
                Ganti Filter
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {filterOptions.map((opt) => {
                  const isSelected = selectedFilter === opt.value;
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
          </div>

          {/* Action CTAs */}
          <div className="mt-6 pt-4 border-t-2 border-[#F0D5D2] space-y-3">
            <button
              data-interactive="true"
              disabled={!compositeUrl || isCompositing || isSaving}
              onClick={() => {
                if (compositeUrl && !isSaving) onConfirm(compositeUrl);
              }}
              className="w-full h-16 btn-duo-primary text-lg flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isSaving ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-base font-black">MEMPROSES BTS & FOTO...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  <span>LANJUT — SIMPAN HASIL</span>
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                </>
              )}
            </button>

            <button
              data-interactive="true"
              onClick={onRetakeAll}
              className="w-full h-12 btn-duo-secondary text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Retake Semua Foto</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
