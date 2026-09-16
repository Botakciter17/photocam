import { Landmark, HandData } from '../types/gesture';

export type TrackingCallback = (
  landmarks: Landmark[] | null,
  isHandPresent: boolean,
  activeHand: HandData | null
) => void;

export class HandTracker {
  private videoElement: HTMLVideoElement | null = null;
  private handsInstance: any = null;
  private cameraInstance: any = null;
  private isFrozen: boolean = false;
  private callback: TrackingCallback | null = null;
  private lastActiveArea: number = 0;
  private isRunning: boolean = false;

  constructor() {}

  /**
   * Initializes webcam and MediaPipe Hands instance.
   */
  public async initialize(
    videoElement: HTMLVideoElement,
    callback: TrackingCallback
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.callback = callback;

    try {
      // Dynamic import with robust fallback for Vite bundler / CommonJS interop
      const mpHandsModule: any = await import('@mediapipe/hands');
      const mediapipeHands =
        (window as any).Hands ||
        mpHandsModule.Hands ||
        mpHandsModule.default?.Hands ||
        mpHandsModule.default;

      const mpCameraModule: any = await import('@mediapipe/camera_utils');
      const cameraUtils =
        (window as any).Camera ||
        mpCameraModule.Camera ||
        mpCameraModule.default?.Camera ||
        mpCameraModule.default;

      this.handsInstance = new mediapipeHands({
        locateFile: (file: string) => {
          // Check local offline assets first, fallback to CDN if not found
          return `/mediapipe/${file}`;
        }
      });

      this.handsInstance.setOptions({
        maxNumHands: 4,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      this.handsInstance.onResults((results: any) => {
        this.processResults(results);
      });

      // Start camera stream
      this.cameraInstance = new cameraUtils(this.videoElement, {
        onFrame: async () => {
          if (!this.isRunning || this.isFrozen) return;
          if (this.videoElement && this.videoElement.readyState >= 2) {
            await this.handsInstance.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720
      });

      await this.cameraInstance.start();
      this.isRunning = true;
      return true;
    } catch (err) {
      console.error('HandTracker initialization failed:', err);
      return false;
    }
  }

  /**
   * Evaluates all detected hands and picks the primary one (largest bounding box / closest to camera).
   */
  private processResults(results: any) {
    if (this.isFrozen) return;

    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      this.lastActiveArea = 0;
      this.callback?.(null, false, null);
      return;
    }

    const candidateHands: HandData[] = results.multiHandLandmarks.map((landmarks: Landmark[]) => {
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const lm of landmarks) {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
      }
      const area = (maxX - minX) * (maxY - minY);
      return {
        landmarks,
        boundingBox: { minX, maxX, minY, maxY, area }
      };
    });

    // Sort by area descending (largest first = closest to camera)
    candidateHands.sort((a, b) => b.boundingBox.area - a.boundingBox.area);

    let selectedHand = candidateHands[0];

    // Spatial hysteresis: if previous area was substantial, keep preference to avoid jitter
    if (this.lastActiveArea > 0 && candidateHands.length > 1) {
      const prevCompatible = candidateHands.find(
        (h) => h.boundingBox.area >= this.lastActiveArea * 0.75
      );
      if (prevCompatible) {
        selectedHand = prevCompatible;
      }
    }

    this.lastActiveArea = selectedHand.boundingBox.area;
    this.callback?.(selectedHand.landmarks, true, selectedHand);
  }

  /**
   * Freezes or unfreezes hand tracking during photo countdown and capture.
   */
  public setFreeze(frozen: boolean) {
    this.isFrozen = frozen;
    if (frozen) {
      this.callback?.(null, false, null);
    }
  }

  public getIsFrozen(): boolean {
    return this.isFrozen;
  }

  public getStream(): MediaStream | null {
    if (this.videoElement && this.videoElement.srcObject) {
      return this.videoElement.srcObject as MediaStream;
    }
    return null;
  }

  public stop() {
    this.isRunning = false;
    if (this.cameraInstance) {
      try {
        this.cameraInstance.stop();
      } catch (e) {}
    }
    if (this.handsInstance) {
      try {
        this.handsInstance.close();
      } catch (e) {}
    }
  }
}
