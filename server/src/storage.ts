import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

// Ensure storage directory exists
if (!fs.existsSync(CONFIG.STORAGE_DIR)) {
  fs.mkdirSync(CONFIG.STORAGE_DIR, { recursive: true });
}

export interface SessionData {
  token: string;
  createdAt: number;
  filename: string;
  shotCount: number;
  frameId: string;
  hasGif?: boolean;
  hasVideo?: boolean;
}

const sessionsMap = new Map<string, SessionData>();

/**
 * Saves photo, optional animated GIF, and optional MP4 video to permanent storage.
 */
export async function savePhoto(
  token: string,
  base64Data: string,
  shotCount: number,
  frameId: string,
  base64Gif?: string,
  base64Video?: string
): Promise<SessionData> {
  // 1. Save Polaroid JPG
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
  const filename = `${token}.jpg`;
  const filePath = path.join(CONFIG.STORAGE_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);

  // 2. Save Animated GIF if provided
  let hasGif = false;
  if (base64Gif && typeof base64Gif === 'string') {
    try {
      const gifMatches = base64Gif.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const gifBuffer = gifMatches ? Buffer.from(gifMatches[2], 'base64') : Buffer.from(base64Gif, 'base64');
      await fs.promises.writeFile(path.join(CONFIG.STORAGE_DIR, `${token}.gif`), gifBuffer);
      hasGif = true;
    } catch (err) {
      console.warn('Failed to save GIF:', err);
    }
  }

  // 3. Save MP4 Video if provided
  let hasVideo = false;
  if (base64Video && typeof base64Video === 'string') {
    try {
      const vidMatches = base64Video.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const vidBuffer = vidMatches ? Buffer.from(vidMatches[2], 'base64') : Buffer.from(base64Video, 'base64');
      await fs.promises.writeFile(path.join(CONFIG.STORAGE_DIR, `${token}.mp4`), vidBuffer);
      hasVideo = true;
    } catch (err) {
      console.warn('Failed to save Video:', err);
    }
  }

  const session: SessionData = {
    token,
    createdAt: Date.now(),
    filename,
    shotCount,
    frameId,
    hasGif,
    hasVideo
  };

  sessionsMap.set(token, session);
  return session;
}

/**
 * Retrieves a session by token.
 */
export function getSession(token: string): SessionData | undefined {
  return sessionsMap.get(token);
}

/**
 * Gets the file path for a photo by token.
 */
export function getPhotoPath(token: string): string | null {
  const filePath = path.join(CONFIG.STORAGE_DIR, `${token}.jpg`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

/**
 * Gets the file path for an animated GIF by token.
 */
export function getGifPath(token: string): string | null {
  const filePath = path.join(CONFIG.STORAGE_DIR, `${token}.gif`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

/**
 * Gets the file path for an MP4 video by token.
 */
export function getVideoPath(token: string): string | null {
  const filePath = path.join(CONFIG.STORAGE_DIR, `${token}.mp4`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
