export type Step = 'menu' | 'setup' | 'capture' | 'preview' | 'download';

export type NavMode = 'hand' | 'mouse' | 'touch';

export type ShotCount = 1 | 2 | 3 | 4;

export type DelaySeconds = 3 | 5 | 10;

export type FilterType = 'normal' | 'bw' | 'vintage';

export interface FrameOption {
  id: string;
  name: string;
  description: string;
  overlayPath: string; // URL to transparent overlay
  accentColor: string;
  theme: 'white-modern' | 'film-strip' | 'retro-neon' | 'minimal-dark';
}

export interface SessionResult {
  token: string;
  downloadUrl: string;
  qrDataUrl: string;
  lanIp: string;
  permanent?: boolean;
  hasGif?: boolean;
  hasVideo?: boolean;
}
