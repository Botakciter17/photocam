import { Landmark } from '../types/gesture';

export class CursorSmoother {
  private currentX: number = window.innerWidth / 2;
  private currentY: number = window.innerHeight / 2;
  private initialized: boolean = false;

  /**
   * Computes the palm center from wrist and MCP landmarks.
   * Palm center is much more stable during finger flexing than fingertips.
   */
  public getPalmCenter(landmarks: Landmark[]): { x: number; y: number } {
    const p0 = landmarks[0];   // Wrist
    const p5 = landmarks[5];   // Index MCP
    const p9 = landmarks[9];   // Middle MCP
    const p17 = landmarks[17]; // Pinky MCP

    return {
      x: (p0.x + p5.x + p9.x + p17.x) / 4,
      y: (p0.y + p5.y + p9.y + p17.y) / 4
    };
  }

  /**
   * Updates cursor coordinate with adaptive EMA filter.
   * Maps mirrored coordinates (x mirrored so moving right moves right).
   */
  public update(landmarks: Landmark[]): { x: number; y: number } {
    const palm = this.getPalmCenter(landmarks);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Mirrored mapping: hand on physical right corresponds to (1 - palm.x)
    // Expand active interactive area slightly so user doesn't have to reach edges of webcam
    const MARGIN = 0.08;
    const normX = Math.max(0, Math.min(1, ((1 - palm.x) - MARGIN) / (1 - 2 * MARGIN)));
    const normY = Math.max(0, Math.min(1, (palm.y - MARGIN) / (1 - 2 * MARGIN)));

    const targetX = normX * screenWidth;
    const targetY = normY * screenHeight;

    if (!this.initialized) {
      this.currentX = targetX;
      this.currentY = targetY;
      this.initialized = true;
      return { x: this.currentX, y: this.currentY };
    }

    // Adaptive smoothing factor based on velocity
    const dx = targetX - this.currentX;
    const dy = targetY - this.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Fast movement gets high alpha (responsive), slow movement gets low alpha (smooth)
    const alpha = Math.min(0.85, Math.max(0.32, 0.32 + dist * 0.005));

    this.currentX += alpha * dx;
    this.currentY += alpha * dy;

    return {
      x: Math.round(this.currentX),
      y: Math.round(this.currentY)
    };
  }

  public reset() {
    this.initialized = false;
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
  }
}
