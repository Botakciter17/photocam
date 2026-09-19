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
  hasVideo?: boolean;
}

const sessionsMap = new Map<string, SessionData>();

/**
 * Saves photo and optional video to permanent storage.
 */
export async function savePhoto(
  token: string,
  base64Data: string,
  shotCount: number,
  frameId: string,
  base64Video?: string
): Promise<SessionData> {
  // 1. Save Polaroid JPG
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
  const filename = `${token}.jpg`;
  const filePath = path.join(CONFIG.STORAGE_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);

  // 2. Save Video if provided (detect mp4 vs webm extension from MIME)
  let hasVideo = false;
  if (base64Video && typeof base64Video === 'string') {
    try {
      const vidMatches = base64Video.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const mime = vidMatches ? vidMatches[1] : 'video/mp4';
      const vidBuffer = vidMatches ? Buffer.from(vidMatches[2], 'base64') : Buffer.from(base64Video, 'base64');

      const ext = mime.includes('webm') ? 'webm' : 'mp4';
      await fs.promises.writeFile(path.join(CONFIG.STORAGE_DIR, `${token}.${ext}`), vidBuffer);
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
 * Gets the file path & mime for a video by token.
 * Checks for both .mp4 and .webm files on disk.
 */
export function getVideoFileInfo(token: string): { filePath: string; mimeType: string; extension: string } | null {
  const mp4Path = path.join(CONFIG.STORAGE_DIR, `${token}.mp4`);
  if (fs.existsSync(mp4Path)) {
    return { filePath: mp4Path, mimeType: 'video/mp4', extension: 'mp4' };
  }

  const webmPath = path.join(CONFIG.STORAGE_DIR, `${token}.webm`);
  if (fs.existsSync(webmPath)) {
    return { filePath: webmPath, mimeType: 'video/webm', extension: 'webm' };
  }

  return null;
}
