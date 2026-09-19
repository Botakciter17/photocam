import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Step, NavMode, ShotCount, DelaySeconds, FilterType, FrameOption, SessionResult } from './types/photobooth';
import { CursorState } from './types/gesture';
import { AVAILABLE_FRAMES } from './types/frames';
import { isMobileDevice } from './utils/device';
import { HandTracker } from './engine/HandTracker';
import { GestureDetector } from './engine/GestureDetector';
import { CursorSmoother } from './engine/CursorSmoother';
import { dispatchVirtualClick } from './utils/virtualClick';
import { VirtualCursor } from './components/VirtualCursor';
import { HandWarningOverlay } from './components/HandWarningOverlay';
import { NavigationModal } from './components/NavigationModal';
import { createAnimatedBtsVideo } from './utils/btsGenerator';
import { MainMenuView } from './views/MainMenuView';
import { SetupView } from './views/SetupView';
import { CaptureView } from './views/CaptureView';
import { PreviewView } from './views/PreviewView';
import { DownloadView } from './views/DownloadView';

export const App: React.FC = () => {
  // Navigation Mode: 'hand' | 'mouse' | 'touch' (mobile skips both)
  const isMobile = isMobileDevice();

  const [navMode, setNavMode] = useState<NavMode>(() => {
    if (isMobile) return 'touch';
    const saved = localStorage.getItem('photobooth_nav_mode') as NavMode | null;
    if (saved === 'hand' || saved === 'mouse') return saved;
    return 'hand'; // Default desktop fallback
  });

  // Navigation Modal: shows on first load for desktop if not chosen yet
  const [isNavModalOpen, setIsNavModalOpen] = useState<boolean>(() => {
    if (isMobile) return false;
    const saved = localStorage.getItem('photobooth_nav_mode');
    return !saved;
  });

  const [isSettingsModal, setIsSettingsModal] = useState<boolean>(false);

  // Photobooth Flow States: menu -> setup -> capture -> preview -> download
  const [step, setStep] = useState<Step>('menu');

  // Session Parameters (configurable in Screen 1 Setup & Screen 3 Preview)
  const [shotCount, setShotCount] = useState<ShotCount>(3);
  const [delay, setDelay] = useState<DelaySeconds>(5);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(AVAILABLE_FRAMES[0]);

  // Photo & Session Data
  const [photos, setPhotos] = useState<string[]>([]);
  const [btsFramesPerShot, setBtsFramesPerShot] = useState<string[][]>([[], [], [], []]);
  const [targetRetakeIndex, setTargetRetakeIndex] = useState<number | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [compositePhotoUrl, setCompositePhotoUrl] = useState<string | null>(null);
  const [btsVideoUrl, setBtsVideoUrl] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);

  // Freeze tracking flag (for distraction-free capture)
  const [isTrackingFrozen, setIsTrackingFrozen] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Hand tracking & virtual cursor state
  const [cursor, setCursor] = useState<CursorState>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    isHandPresent: false,
    isFist: false,
    fistProgress: 0,
    isClickTriggered: false,
    isHoveringInteractive: false
  });

  // Idle watchdog timers
  const [noHandSeconds, setNoHandSeconds] = useState<number>(0);
  const [downloadSecondsRemaining, setDownloadSecondsRemaining] = useState<number>(45);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const gestureRef = useRef<GestureDetector>(new GestureDetector());
  const smootherRef = useRef<CursorSmoother>(new CursorSmoother());
  const isTrackingFrozenRef = useRef<boolean>(false);
  isTrackingFrozenRef.current = isTrackingFrozen;

  const navModeRef = useRef<NavMode>(navMode);
  navModeRef.current = navMode;

  // Initialize Hand Tracker & Camera Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tracker = new HandTracker();
    trackerRef.current = tracker;

    tracker.initialize(video, (landmarks, isHandPresent) => {
      setIsCameraReady(true);
      const stream = tracker.getStream();
      if (stream) {
        setMediaStream((prev) => prev || stream);
      }

      // If user chose mouse or touch, or tracking is frozen, skip hand cursor calculation
      if (navModeRef.current !== 'hand' || isTrackingFrozenRef.current) {
        setCursor((prev) => ({ ...prev, isHandPresent: false, fistProgress: 0 }));
        return;
      }

      if (!isHandPresent || !landmarks) {
        gestureRef.current.update(false, null);
        setCursor((prev) => ({
          ...prev,
          isHandPresent: false,
          isFist: false,
          fistProgress: 0,
          isClickTriggered: false,
          isHoveringInteractive: false
        }));
        return;
      }

      // Smooth cursor position
      const { x, y } = smootherRef.current.update(landmarks);

      // Evaluate kuncup gesture
      const gesture = gestureRef.current.update(true, landmarks);

      // Check if cursor hovers over an interactive element
      const elementUnderPoint = document.elementFromPoint(x, y);
      const isHovering = Boolean(elementUnderPoint?.closest('[data-interactive="true"]'));

      setCursor({
        x,
        y,
        isHandPresent: true,
        isFist: gesture.isFist,
        fistProgress: gesture.progress,
        isClickTriggered: gesture.isClickTriggered,
        isHoveringInteractive: isHovering
      });

      // Dispatch virtual click on confirmed kuncup hold
      if (gesture.isClickTriggered) {
        dispatchVirtualClick(x, y);
      }
    });

    return () => {
      tracker.stop();
    };
  }, []);

  // Sync freeze state
  const setFreeze = useCallback((frozen: boolean) => {
    setIsTrackingFrozen(frozen);
    trackerRef.current?.setFreeze(frozen);
    if (frozen) {
      gestureRef.current.reset();
      setCursor((prev) => ({
        ...prev,
        isHandPresent: false,
        isFist: false,
        fistProgress: 0,
        isClickTriggered: false,
        isHoveringInteractive: false
      }));
    }
  }, []);

  // Idle watchdog timer
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Download screen auto-reset timer
      if (step === 'download') {
        setDownloadSecondsRemaining((prev) => {
          if (prev <= 1) {
            resetToMenu();
            return 45;
          }
          return prev - 1;
        });
      }

      // 2. Idle hand detection (only active when in 'hand' gesture mode)
      if (navMode === 'hand' && step !== 'menu' && step !== 'capture' && !isTrackingFrozen) {
        if (!cursor.isHandPresent) {
          setNoHandSeconds((prev) => {
            const next = prev + 1;
            if (next >= 45) {
              resetToMenu();
              return 0;
            }
            return next;
          });
        } else {
          setNoHandSeconds(0);
        }
      } else {
        setNoHandSeconds(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, navMode, isTrackingFrozen, cursor.isHandPresent]);

  const resetToMenu = () => {
    setStep('menu');
    setPhotos([]);
    setBtsFramesPerShot([[], [], [], []]);
    setTargetRetakeIndex(null);
    setSessionResult(null);
    setCompositePhotoUrl(null);
    setBtsVideoUrl(null);
    setIsSavingSession(false);
    setNoHandSeconds(0);
    setDownloadSecondsRemaining(45);
    setFreeze(false);
  };

  // Flow Navigation Handlers
  const handleStartCaptureSession = () => {
    setTargetRetakeIndex(null);
    setStep('capture');
  };

  const handleCancelCapture = () => {
    setFreeze(false);
    setStep('setup');
  };

  const handleCaptureComplete = (capturedPhotos: string[], btsPerShot?: string[][]) => {
    setPhotos(capturedPhotos);
    if (btsPerShot && btsPerShot.length > 0) {
      setBtsFramesPerShot(btsPerShot);
    }
    setTargetRetakeIndex(null);
    setFreeze(false);
    setStep('preview');
  };

  const handleRetakeSingle = (index: number) => {
    setTargetRetakeIndex(index);
    setStep('capture');
  };

  const handleRetakeAll = () => {
    setPhotos([]);
    setBtsFramesPerShot([[], [], [], []]);
    setTargetRetakeIndex(null);
    setStep('capture');
  };

  const handleConfirmSave = async (compositeDataUrl: string) => {
    setCompositePhotoUrl(compositeDataUrl);
    setIsSavingSession(true);

    let videoDataUrl: string | undefined;

    // Generate Animated BTS Polaroid Strip Video MP4/WebM
    try {
      const btsVideo = await createAnimatedBtsVideo(
        photos.slice(0, shotCount),
        btsFramesPerShot,
        shotCount,
        selectedFrame,
        filter
      );
      setBtsVideoUrl(btsVideo.dataUrl);
      videoDataUrl = btsVideo.dataUrl;
    } catch (err) {
      console.error('Failed to generate BTS Video:', err);
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compositeDataUrl,
          shotCount,
          frameId: selectedFrame.id,
          video: videoDataUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session on server');
      }

      const data: SessionResult = await response.json();
      setSessionResult(data);
      setDownloadSecondsRemaining(45);
      setIsSavingSession(false);
      setStep('download');
    } catch (err) {
      console.error('Session upload error:', err);
      setIsSavingSession(false);
      alert('Gagal menghubungi server lokal. Pastikan server aktif.');
    }
  };

  const handleSelectNavMode = (mode: NavMode) => {
    setNavMode(mode);
    localStorage.setItem('photobooth_nav_mode', mode);
    setIsNavModalOpen(false);
    setIsSettingsModal(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsModal(true);
    setIsNavModalOpen(true);
  };

  return (
    <div className="relative h-screen w-screen bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden font-sans">
      {/* Background Persistent Video for MediaPipe & Webcam Capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed top-0 left-0 w-64 h-36 opacity-0 pointer-events-none -z-50"
      />

      {/* Virtual Cursor Overlay (only active in 'hand' gesture mode) */}
      <VirtualCursor
        cursor={cursor}
        isVisible={navMode === 'hand' && !isTrackingFrozen}
      />

      {/* 10s Idle Warning Overlay (only active in 'hand' gesture mode) */}
      <HandWarningOverlay
        show={navMode === 'hand' && noHandSeconds >= 10 && step !== 'menu' && step !== 'capture'}
        secondsRemaining={Math.max(0, 45 - noHandSeconds)}
      />

      {/* Navigation Selection / Settings Modal */}
      <NavigationModal
        isOpen={isNavModalOpen}
        currentMode={navMode}
        isSettingsMode={isSettingsModal}
        onSelectMode={handleSelectNavMode}
        onClose={() => {
          setIsNavModalOpen(false);
          setIsSettingsModal(false);
        }}
      />

      {/* Screen 0: Main Menu Standby Screen */}
      {step === 'menu' && (
        <MainMenuView
          navMode={navMode}
          onStart={() => setStep('setup')}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 1: Setup (Parameters & Live Split Preview) */}
      {step === 'setup' && (
        <SetupView
          stream={mediaStream}
          shotCount={shotCount}
          delay={delay}
          filter={filter}
          selectedFrame={selectedFrame}
          navMode={navMode}
          isCameraReady={isCameraReady}
          onUpdateShotCount={setShotCount}
          onUpdateDelay={setDelay}
          onUpdateFilter={setFilter}
          onUpdateFrame={setSelectedFrame}
          onBackToMenu={() => setStep('menu')}
          onOpenSettings={handleOpenSettings}
          onStartSession={handleStartCaptureSession}
        />
      )}

      {/* Screen 2: Capture (Full-screen camera + frame + countdown + progress dots) */}
      {step === 'capture' && (
        <CaptureView
          stream={mediaStream}
          shotCount={shotCount}
          delay={delay}
          filter={filter}
          selectedFrame={selectedFrame}
          targetShotIndex={targetRetakeIndex}
          existingPhotos={photos}
          setFreezeTracking={setFreeze}
          onCancel={handleCancelCapture}
          onComplete={handleCaptureComplete}
        />
      )}

      {/* Screen 3: Preview & Retake (Result Strip + Partial Retake + Live Frame/Filter swap) */}
      {step === 'preview' && (
        <PreviewView
          photos={photos}
          btsFramesPerShot={btsFramesPerShot}
          shotCount={shotCount}
          selectedFrame={selectedFrame}
          selectedFilter={filter}
          isSaving={isSavingSession}
          onUpdateFrame={setSelectedFrame}
          onUpdateFilter={setFilter}
          onRetakeSingle={handleRetakeSingle}
          onRetakeAll={handleRetakeAll}
          onConfirm={handleConfirmSave}
        />
      )}

      {/* Screen 4: QR Download (Result Strip + BTS MP4 + Big QR + Direct Download) */}
      {step === 'download' && sessionResult && (
        <DownloadView
          session={sessionResult}
          compositePhotoUrl={compositePhotoUrl}
          btsVideoUrl={btsVideoUrl}
          secondsRemaining={downloadSecondsRemaining}
          onBackToResult={() => setStep('preview')}
          onNewSession={resetToMenu}
        />
      )}
    </div>
  );
};
