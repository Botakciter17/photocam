import React, { useEffect, useState, useRef } from 'react';
import { ShotCount, DelaySeconds, FilterType, FrameOption } from '../types/photobooth';
import { getFilterCss } from '../utils/canvasCompositor';
import { soundEffects } from '../engine/SoundEffects';
import { Check, Sparkles } from 'lucide-react';

interface CaptureViewProps {
  stream: MediaStream | null;
  shotCount: ShotCount;
  delay: DelaySeconds;
  filter: FilterType;
  selectedFrame: FrameOption;
  targetShotIndex?: number | null; // If set, only retakes this index
  existingPhotos?: string[];
  setFreezeTracking: (frozen: boolean) => void;
  onCancel: () => void;
  onComplete: (photos: string[], btsFramesPerShot?: string[][]) => void;
}

const CaptureViewComponent: React.FC<CaptureViewProps> = ({
  stream,
  shotCount,
  delay,
  filter,
  selectedFrame,
  targetShotIndex = null,
  existingPhotos = [],
  setFreezeTracking,
  onCancel,
  onComplete
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [currentShot, setCurrentShot] = useState<number>(
    targetShotIndex !== null ? targetShotIndex : 0
  );
  const [countdown, setCountdown] = useState<number | null>(delay);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [delayMessage, setDelayMessage] = useState<string | null>(null);

  const capturedPhotosRef = useRef<string[]>([...existingPhotos]);
  const btsFramesPerShotRef = useRef<string[][]>([[], [], [], []]);

  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [stream]);

  // Live motion sampler: samples live frames during countdown for BTS GIF & MP4
  useEffect(() => {
    const sampleFrame = () => {
      const video = localVideoRef.current;
      if (video && video.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 480, 270);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          if (!btsFramesPerShotRef.current[currentShot]) {
            btsFramesPerShotRef.current[currentShot] = [];
          }
          btsFramesPerShotRef.current[currentShot].push(dataUrl);
        }
      }
    };

    if (countdown !== null && countdown > 0) {
      sampleFrame(); // Capture immediate frame on each countdown tick
      const interval = setInterval(sampleFrame, 200);
      return () => clearInterval(interval);
    }
  }, [countdown, currentShot]);

  // Freeze tracking during capture screen
  useEffect(() => {
    setFreezeTracking(true);
    return () => {
      setFreezeTracking(false);
    };
  }, [setFreezeTracking]);

  // Countdown timer loop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (countdown !== null && countdown > 0) {
      soundEffects.playBeep(countdown === 1);
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      snapPhoto();
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  const snapPhoto = () => {
    const video = localVideoRef.current;
    if (!video || video.readyState < 2) {
      console.warn('Video stream not ready for snapshot', video);
      return;
    }

    soundEffects.playShutter();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      if (!btsFramesPerShotRef.current[currentShot]) {
        btsFramesPerShotRef.current[currentShot] = [];
      }
      btsFramesPerShotRef.current[currentShot].push(photoDataUrl);

      if (targetShotIndex !== null) {
        capturedPhotosRef.current[targetShotIndex] = photoDataUrl;
        setTimeout(() => {
          onComplete(capturedPhotosRef.current, btsFramesPerShotRef.current);
        }, 500);
        return;
      }

      capturedPhotosRef.current[currentShot] = photoDataUrl;

      if (currentShot < shotCount - 1) {
        setDelayMessage(`Keren! Bersiap untuk foto ke-${currentShot + 2}...`);
        setCountdown(null);

        setTimeout(() => {
          setDelayMessage(null);
          setCurrentShot((prev) => prev + 1);
          setCountdown(delay);
        }, 1800);
      } else {
        setTimeout(() => {
          onComplete(capturedPhotosRef.current, btsFramesPerShotRef.current);
        }, 600);
      }
    }
  };

  const displayShotNumber = targetShotIndex !== null ? targetShotIndex + 1 : currentShot + 1;

  return (
    <div className="relative h-full w-full bg-[#FDF7F5] overflow-hidden flex flex-col justify-between select-none p-6">
      {/* Flash Effect on Capture */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
      )}

      {/* 1. Top Bar: Cancel, Progress Pill, Filter Badge */}
      <header className="h-16 px-6 rounded-2xl bg-white border-2 border-b-4 border-[#E8CEC9] flex items-center justify-between z-30 shadow-sm">
        <button
          data-interactive="true"
          onClick={onCancel}
          className="btn-duo-secondary px-4 py-2 text-xs font-black"
        >
          <span>Batal</span>
        </button>

        <div className="bg-[#FFF0ED] border-2 border-[#E8CEC9] px-5 py-1.5 rounded-full">
          <span className="text-sm font-black text-[#D34B4D]">
            Jepretan {displayShotNumber} dari {shotCount}
          </span>
        </div>

        <div className="text-xs font-black text-[#4B3F3D] bg-[#FFF0ED] border-2 border-[#E8CEC9] px-3.5 py-1.5 rounded-2xl capitalize">
          Filter: {filter}
        </div>
      </header>

      {/* 2. Middle Area: Live Camera Feed in 3D Card with Big Golden Countdown */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
        <div className="relative w-full h-full max-h-[75vh] aspect-video rounded-[2.5rem] overflow-hidden bg-black border-4 border-b-8 border-[#E8CEC9] shadow-2xl flex items-center justify-center">
          {/* Live Camera Feed */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ filter: getFilterCss(filter) }}
            className="w-full h-full object-cover -scale-x-100"
          />

          {/* Frame Overlay */}
          <img
            src={selectedFrame.overlayPath}
            alt="Frame Overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          />

          {/* Big Duolingo Golden Sun Countdown */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="relative flex items-center justify-center">
                <div className="w-56 h-56 rounded-full bg-[#FFC800]/30 animate-ping absolute" />
                <div className="w-44 h-44 rounded-full bg-[#FFC800] border-4 border-b-8 border-[#E5A500] flex items-center justify-center shadow-2xl">
                  <span className="text-8xl font-black text-[#4B3F3D] animate-bounce">
                    {countdown}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cheerful Delay Message */}
          {delayMessage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="px-8 py-6 rounded-3xl bg-white border-4 border-b-8 border-[#D34B4D] shadow-2xl text-center animate-bounce">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#D34B4D] bg-[#FFF0ED] px-3 py-1 rounded-full mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Hebat!</span>
                </div>
                <p className="text-2xl font-black text-[#4B3F3D]">{delayMessage}</p>
                <p className="text-sm font-bold text-[#8B7B78] mt-1">Siapkan senyum terbaik kamu!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Bar: Duolingo Milestone Progress Dots */}
      <footer className="py-4 px-6 bg-white rounded-2xl border-2 border-b-4 border-[#E8CEC9] flex flex-col items-center gap-2 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          {Array.from({ length: shotCount }, (_, idx) => {
            const isDone = idx < currentShot;
            const isActive = idx === currentShot;

            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black transition-all duration-200 ${
                  isDone
                    ? 'bg-[#58CC02] text-white border-2 border-[#46A302] border-b-4 border-b-[#337A01] shadow-sm'
                    : isActive
                    ? 'bg-[#D34B4D] text-white border-2 border-[#7E2123] border-b-5 border-b-[#7E2123] scale-110 shadow-md'
                    : 'bg-white text-[#8B7B78] border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE]'
                }`}
              >
                {isDone ? <Check className="w-6 h-6 stroke-[3.5]" /> : idx + 1}
              </div>
            );
          })}
        </div>

        <p className="text-xs font-black text-[#4B3F3D]">
          Jepretan otomatis tiap <span className="text-[#D34B4D] font-black">{delay} detik</span>
        </p>
      </footer>
    </div>
  );
};

export const CaptureView = React.memo(CaptureViewComponent);
