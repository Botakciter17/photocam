export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    area: number;
  };
}

export interface CursorState {
  x: number; // Screen pixel X
  y: number; // Screen pixel Y
  isHandPresent: boolean;
  isFist: boolean; // Raw fist detection status
  fistProgress: number; // 0 to 1 progress during 300ms hold
  isClickTriggered: boolean; // True on single click edge
  isHoveringInteractive?: boolean; // True when hovering over an interactive button/element
}
