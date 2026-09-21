import { Landmark } from '../types/gesture';

function dist3D(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export class GestureDetector {
  private gestureStartTime: number | null = null;
  private isClickLocked: boolean = false;
  private readonly HOLD_THRESHOLD_MS = 280; // 280ms hold for responsive kuncup click
  private readonly RELEASE_COOLDOWN_MS = 140;
  private lastReleaseTime: number = 0;

  /**
   * Evaluates hand landmarks to detect if the hand is in a "kuncup" gesture (pinched / clustered fingertips 🤌).
   * Fingertips converge together towards the thumb tip.
   */
  public isKuncup(landmarks: Landmark[]): boolean {
    if (!landmarks || landmarks.length < 21) return false;

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palmLength = dist3D(wrist, middleMcp);

    // Guard against zero division or malformed landmark data
    if (palmLength < 0.001) return false;

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Normalized distances between fingertips and thumb tip
    const dIndexThumb = dist3D(indexTip, thumbTip) / palmLength;
    const dMiddleThumb = dist3D(middleTip, thumbTip) / palmLength;
    const dRingThumb = dist3D(ringTip, thumbTip) / palmLength;

    // Cluster radius: average spread of tips
    const avgTipDist = (dIndexThumb + dMiddleThumb + dRingThumb) / 3;

    // Kuncup condition:
    // 1. Thumb and index tips are pinched close together (< 0.38 of palm)
    // 2. Middle finger is also drawn close (< 0.50) OR tips cluster tightly (< 0.42)
    const isPinchCluster = (dIndexThumb < 0.38 && dMiddleThumb < 0.52) || (avgTipDist < 0.42);

    // Also support all 5 fingers gathered into a point (classic kuncup)
    const dPinkyThumb = dist3D(pinkyTip, thumbTip) / palmLength;
    const isFullKuncup = dIndexThumb < 0.45 && dMiddleThumb < 0.48 && dRingThumb < 0.55 && dPinkyThumb < 0.65;

    return isPinchCluster || isFullKuncup;
  }

  /**
   * Backward-compatible alias for isKuncup
   */
  public isFist(landmarks: Landmark[]): boolean {
    return this.isKuncup(landmarks);
  }

  /**
   * Processes current frame state.
   * Returns:
   * - isFist: boolean (active kuncup gesture)
   * - progress: 0.0 to 1.0 (fill percentage towards 280ms click)
   * - isClickTriggered: boolean (true only on single frame edge when hold is complete)
   */
  public update(isHandPresent: boolean, landmarks: Landmark[] | null): {
    isFist: boolean;
    progress: number;
    isClickTriggered: boolean;
  } {
    const now = performance.now();

    if (!isHandPresent || !landmarks) {
      this.gestureStartTime = null;
      this.isClickLocked = false;
      return { isFist: false, progress: 0, isClickTriggered: false };
    }

    const kuncupNow = this.isKuncup(landmarks);

    if (!kuncupNow) {
      // Hand is open / spread
      this.gestureStartTime = null;
      if (this.isClickLocked && now - this.lastReleaseTime > this.RELEASE_COOLDOWN_MS) {
        this.isClickLocked = false;
      }
      return { isFist: false, progress: 0, isClickTriggered: false };
    }

    // Kuncup is active
    this.lastReleaseTime = now;

    if (this.isClickLocked) {
      // Already clicked, waiting for user to open hand before next click
      return { isFist: true, progress: 1, isClickTriggered: false };
    }

    if (this.gestureStartTime === null) {
      this.gestureStartTime = now;
    }

    const elapsed = now - this.gestureStartTime;
    const progress = Math.min(1, elapsed / this.HOLD_THRESHOLD_MS);

    if (progress >= 1) {
      // Trigger click edge!
      this.isClickLocked = true;
      return { isFist: true, progress: 1, isClickTriggered: true };
    }

    return { isFist: true, progress, isClickTriggered: false };
  }

  /**
   * Resets all gesture state.
   */
  public reset() {
    this.gestureStartTime = null;
    this.isClickLocked = false;
    this.lastReleaseTime = 0;
  }
}
