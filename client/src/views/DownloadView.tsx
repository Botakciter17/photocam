import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SessionResult } from '../types/photobooth';
import { Download, Copy, RotateCcw, QrCode, Check, Image, Video } from 'lucide-react';

interface DownloadViewProps {
  session: SessionResult;
  compositePhotoUrl?: string | null;
  btsVideoUrl?: string | null;
  secondsRemaining: number;
  onBackToResult: () => void;
  onNewSession: () => void;
}

export const DownloadView: React.FC<DownloadViewProps> = ({
  session,
  compositePhotoUrl,
  btsVideoUrl,
  secondsRemaining,
  onBackToResult,
  onNewSession
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'photo' | 'video'>('video');

  useEffect(() => {
    try {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#D34B4D', '#FFC800', '#58CC02', '#1CB0F6', '#FFFFFF']
      });
    } catch (e) {
      console.warn('Confetti effect failed', e);
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(session.downloadUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const downloadFile = (url: string | null | undefined, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden select-none p-6 gap-6">
      {/* 1. Top Bar */}
      <header className="h-16 px-8 rounded-2xl bg-white border-2 border-b-4 border-[#E8CEC9] flex items-center justify-between z-20 shadow-sm">
        <button
          data-interactive="true"
          onClick={onBackToResult}
          className="btn-duo-secondary px-4 py-2 text-xs font-black"
        >
          <span>Kembali ke Hasil</span>
        </button>

        <div className="bg-[#FFF0ED] border-2 border-[#E8CEC9] px-5 py-1.5 rounded-full text-xs font-black text-duo-red uppercase tracking-wider">
          <span>Foto Siap Diambil</span>
        </div>

        <button
          data-interactive="true"
          onClick={onNewSession}
          className="btn-duo-secondary px-5 py-2 text-xs font-black text-duo-text"
        >
          Selesai
        </button>
      </header>

      {/* 2. Main 2-Column Split: Left (Preview Strip / Video) | Right (QR & Download Actions) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden gap-6">
        {/* Left Column: Result Preview with Tab Switcher */}
        <section className="flex-[48] flex flex-col items-center justify-center">
          {/* Preview Tab Buttons */}
          <div className="flex gap-2.5 p-2 bg-white rounded-2xl border-2 border-[#E8CEC9] mb-3 shadow-sm">
            <button
              data-interactive="true"
              onClick={() => setPreviewTab('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'photo' ? 'btn-select-active' : 'btn-select-inactive'
              }`}
            >
              <Image className="w-4 h-4 stroke-[2.5]" />
              <span>Polaroid (Foto)</span>
            </button>

            {btsVideoUrl && (
              <button
                data-interactive="true"
                onClick={() => setPreviewTab('video')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'video' ? 'btn-select-active' : 'btn-select-inactive'
                }`}
              >
                <Video className="w-4 h-4 stroke-[2.5]" />
                <span>Video Live</span>
              </button>
            )}
          </div>

          <div className="relative w-full h-full max-h-[74vh] rounded-[2.5rem] bg-white border-4 border-b-8 border-[#E8CEC9] shadow-xl flex items-center justify-center p-4">
            {previewTab === 'photo' && compositePhotoUrl && (
              <img
                src={compositePhotoUrl}
                alt="Final Photobooth Strip"
                className="h-full max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
              />
            )}

            {previewTab === 'video' && (
              btsVideoUrl ? (
                <video
                  src={btsVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="h-full max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-duo-red">
                  <div className="w-10 h-10 border-4 border-duo-red border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-duo-muted">Menyiapkan video live...</span>
                </div>
              )
            )}
          </div>
        </section>

        {/* Right Column: QR Code, Expiry & Download Actions */}
        <section className="flex-[52] bg-white rounded-[2.5rem] border-4 border-b-8 border-[#E8CEC9] p-8 flex flex-col items-center justify-between overflow-y-auto text-center shadow-xl">
          <div className="flex flex-col items-center max-w-md w-full my-auto space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[#D34B4D] text-xs font-black uppercase tracking-wider bg-[#FFF0ED] border-2 border-[#E8CEC9] px-3.5 py-1.5 rounded-full mb-2">
                <QrCode className="w-4 h-4 stroke-[2.5]" />
                <span>Scan Lewat HP</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#4B3F3D] tracking-tight">
                Scan Buat Simpan ke HP!
              </h2>
              <p className="text-[#8B7B78] text-xs font-bold mt-1">
                Scan QR code untuk mengunduh foto polaroid atau video live dibalik layar
              </p>
            </div>

            {/* Chunky QR Code Card */}
            <div className="p-4 bg-white rounded-3xl border-4 border-b-8 border-[#D34B4D] shadow-xl">
              <img
                src={session.qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 md:w-52 md:h-52 object-contain rounded-2xl"
              />
            </div>

            {/* URL Info */}
            <div className="space-y-1 w-full">
              <div className="inline-flex items-center gap-2 text-[#D34B4D] font-black text-xs bg-[#FFF0ED] border border-[#E8CEC9] px-4 py-1.5 rounded-full">
                <span>Tautan Permanen • Tersimpan Selamanya</span>
              </div>
              <p className="text-[11px] font-mono text-[#4B3F3D] break-all mt-1">
                {session.downloadUrl}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              {btsVideoUrl ? (
                <>
                  <button
                    data-interactive="true"
                    onClick={() => downloadFile(btsVideoUrl, `photobooth-live-${session.token.slice(0, 8)}.mp4`)}
                    className="w-full h-14 btn-duo-primary text-base flex items-center justify-center gap-2.5"
                  >
                    <Download className="w-5 h-5 stroke-[3]" />
                    <span>UNDUH VIDEO LIVE</span>
                  </button>
                  <button
                    data-interactive="true"
                    onClick={() => downloadFile(compositePhotoUrl, `photobooth-${session.token.slice(0, 8)}.jpg`)}
                    className="w-full h-12 btn-duo-secondary text-xs font-black flex items-center justify-center gap-2 hover:border-duo-red"
                  >
                    <Image className="w-4 h-4 text-duo-red stroke-[2.5]" />
                    <span>UNDUH POLAROID (JPG)</span>
                  </button>
                </>
              ) : (
                <button
                  data-interactive="true"
                  onClick={() => downloadFile(compositePhotoUrl, `photobooth-${session.token.slice(0, 8)}.jpg`)}
                  className="w-full h-14 btn-duo-primary text-base flex items-center justify-center gap-2.5"
                >
                  <Download className="w-5 h-5 stroke-[3]" />
                  <span>UNDUH POLAROID (JPG)</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  data-interactive="true"
                  onClick={handleCopyLink}
                  className="h-11 btn-duo-secondary text-xs font-black flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-duo-green stroke-[3]" />
                      <span className="text-duo-green font-black">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.5]" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>

                <button
                  data-interactive="true"
                  onClick={onNewSession}
                  className="h-11 btn-duo-yellow text-xs font-black flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 stroke-[3]" />
                  <span>Foto Lagi</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-[#8B7B78] mt-2">
            Reset otomatis dalam <span className="text-duo-red font-black">{secondsRemaining}</span> detik
          </div>
        </section>
      </main>
    </div>
  );
};
