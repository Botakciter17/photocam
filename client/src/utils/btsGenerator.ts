import { ShotCount, FrameOption, FilterType } from '../types/photobooth';
import { getStripLayout, getFilterCss } from './canvasCompositor';
import { encodeGif, blobToDataUrl } from './gifEncoder';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Do NOT set crossOrigin on data: URLs as browsers will block them with CORS error
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Draws a cute 4-pointed twinkling star (BeautyPlus style).
 */
function drawTwinklingStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  alpha: number
) {
  if (alpha <= 0.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
  ctx.fillStyle = color;
  ctx.beginPath();
  const inner = radius * 0.28;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    const mid = angle + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(mid) * inner, cy + Math.sin(mid) * inner);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws the Polaroid Frame and footer onto the canvas at a given scale.
 */
function drawPolaroidBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: FrameOption,
  scale: number,
  chinY: number,
  t: number,
  totalFrames: number
) {
  const isLight = frame.theme === 'white-modern';

  // 1. Solid Polaroid Card Background
  ctx.fillStyle = isLight ? '#FFFFFF' : '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // 2. Film Strip Sprocket Holes
  if (frame.theme === 'film-strip') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FFFFFF';
    const holeW = 32 * scale;
    const holeH = 22 * scale;
    const holeR = 4 * scale;
    const stepY = 48 * scale;
    const totalHoles = Math.floor((height - 20 * scale) / stepY);

    for (let i = 0; i < totalHoles; i++) {
      const curY = 15 * scale + i * stepY;
      ctx.beginPath();
      ctx.roundRect(10 * scale, curY, holeW, holeH, holeR);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(width - 10 * scale - holeW, curY, holeW, holeH, holeR);
      ctx.fill();
    }
  }

  // 3. Top Blinking "REC ● LIVE PHOTO" badge (BeautyPlus style)
  ctx.save();
  const isBlinkOn = t % 4 < 3;
  ctx.fillStyle = 'rgba(211, 75, 77, 0.95)';
  ctx.beginPath();
  ctx.roundRect(24 * scale, 24 * scale, 170 * scale, 34 * scale, 10 * scale);
  ctx.fill();

  if (isBlinkOn) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(42 * scale, 41 * scale, 5 * scale, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.font = `900 ${Math.round(13 * scale)}px -apple-system, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('LIVE PHOTO', 56 * scale, 45 * scale);
  ctx.restore();

  // 4. Twinkling BeautyPlus Sparkles across the frame
  const sparklePhase = (t / totalFrames) * 2 * Math.PI;
  drawTwinklingStar(ctx, width - 40 * scale, 36 * scale, 18 * scale, '#FFC800', 0.5 + 0.5 * Math.sin(sparklePhase));
  drawTwinklingStar(ctx, 36 * scale, height - 45 * scale, 16 * scale, '#FFC800', 0.5 + 0.5 * Math.cos(sparklePhase));
  drawTwinklingStar(ctx, width - 35 * scale, height - 60 * scale, 14 * scale, '#D34B4D', 0.5 + 0.5 * Math.sin(sparklePhase + 1.5));

  // 5. Bottom Chin Text
  ctx.save();
  if (frame.theme === 'white-modern') {
    ctx.font = `900 ${Math.round(24 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTOBOOTH • LIVE MOTION', width / 2, chinY);

    ctx.font = `bold ${Math.round(15 * scale)}px -apple-system, sans-serif`;
    ctx.fillStyle = '#D34B4D';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillText(dateStr.toUpperCase(), width / 2, chinY + 32 * scale);
  } else if (frame.theme === 'film-strip') {
    ctx.font = `bold ${Math.round(20 * scale)}px "Courier New", monospace`;
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('KODAK COLORPLUS • LIVE BTS', width / 2, chinY + 12 * scale);
  } else if (frame.theme === 'retro-neon') {
    ctx.font = `900 ${Math.round(22 * scale)}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = '#F43F5E';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERPUNK NIGHTS // LIVE', width / 2, chinY + 12 * scale);
  } else {
    // Minimal Dark Gold
    ctx.font = `italic ${Math.round(22 * scale)}px "Georgia", serif`;
    ctx.fillStyle = '#FCD34D';
    ctx.textAlign = 'center';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    ctx.fillText(`— Memoir Live • ${dateStr} —`, width / 2, chinY + 12 * scale);
  }
  ctx.restore();
}

/**
 * Creates an animated Behind-The-Scenes (BTS) Portrait Polaroid Strip GIF (BeautyPlus Style).
 * Photos move with live zoom breathing motion, shutter flash, and animated sparkles!
 */
export async function createAnimatedBtsGif(
  photos: string[],
  framesPerShot: string[][],
  shotCount: ShotCount,
  frame: FrameOption,
  filter: FilterType = 'normal'
): Promise<{ blob: Blob; dataUrl: string }> {
  if (!photos || photos.length === 0) {
    throw new Error('No photos available to create GIF');
  }

  const fullLayout = getStripLayout(shotCount);

  // Scaled resolution for fast encoding & crisp rendering
  const width = 480;
  const scale = width / fullLayout.width; // 0.4
  const height = Math.round(fullLayout.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Load all images for each slot
  const loadedSlotsImgs: HTMLImageElement[][] = [];
  for (let i = 0; i < shotCount; i++) {
    const rawFrames =
      framesPerShot[i] && framesPerShot[i].length > 0
        ? framesPerShot[i]
        : photos[i]
        ? [photos[i]]
        : [photos[0]];

    const loaded = await Promise.all(rawFrames.map((s) => loadImage(s)));
    loadedSlotsImgs.push(loaded);
  }

  // 16 animated frames for a super smooth loop (~2.4 seconds total)
  const totalGifFrames = 16;
  const gifFrames: ImageData[] = [];
  const chinY = height - 90 * scale;

  for (let t = 0; t < totalGifFrames; t++) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Polaroid Strip Base with animated sparkles and live badge
    drawPolaroidBackground(ctx, width, height, frame, scale, chinY, t, totalGifFrames);

    // 2. Draw each photo slot with BeautyPlus live motion
    for (let i = 0; i < shotCount; i++) {
      const slotImages = loadedSlotsImgs[i];
      if (!slotImages || slotImages.length === 0) continue;

      const img = slotImages[t % slotImages.length];
      const slot = fullLayout.slots[i];
      if (!slot) continue;

      const sx = slot.x * scale;
      const sy = slot.y * scale;
      const sw = slot.w * scale;
      const sh = slot.h * scale;

      // BeautyPlus Signature Motion: smooth zoom oscillation + slight pan
      // Guarantees noticeable live animation even with single shots!
      const phase = (t / totalGifFrames) * 2 * Math.PI + i * 1.5;
      const motionZoom = 1.0 + 0.07 * (0.5 + 0.5 * Math.sin(phase));
      const motionPanX = (sw * 0.03) * Math.sin(phase * 0.5);

      ctx.save();
      // Clip to rounded slot
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 14 * scale);
      ctx.clip();

      // Apply filter
      ctx.filter = getFilterCss(filter);

      // Object fit cover calculation with dynamic zoom
      const imgAspect = img.width / img.height;
      const slotAspect = sw / sh;
      let cW = img.width / motionZoom;
      let cH = img.height / motionZoom;
      let cX = (img.width - cW) / 2 + motionPanX;
      let cY = (img.height - cH) / 2;

      if (imgAspect > slotAspect) {
        cW = (img.height * slotAspect) / motionZoom;
        cX = (img.width - cW) / 2 + motionPanX;
      } else {
        cH = (img.width / slotAspect) / motionZoom;
        cY = (img.height - cH) / 2;
      }

      // Draw mirrored horizontally
      ctx.translate(sx + sw, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, cX, cY, cW, cH, 0, 0, sw, sh);

      // Subtle shutter flash pop when transitioning
      if (t === i * 4) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(0, 0, sw, sh);
      }

      ctx.restore();

      // Slot Border Style
      if (frame.theme === 'white-modern') {
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 14 * scale);
        ctx.stroke();
      } else if (frame.theme === 'retro-neon') {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 14 * scale);
        ctx.stroke();
      } else if (frame.theme === 'minimal-dark') {
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 14 * scale);
        ctx.stroke();
      }
    }

    ctx.restore();
    gifFrames.push(ctx.getImageData(0, 0, width, height));
  }

  // Encode GIF with 150ms delay per frame (super smooth live playback)
  const gifBlob = encodeGif(gifFrames, width, height, 150);
  const dataUrl = await blobToDataUrl(gifBlob);

  return { blob: gifBlob, dataUrl };
}

/**
 * Creates an animated MP4/WebM video of the Portrait Polaroid Strip (BeautyPlus Style).
 */
export async function createAnimatedBtsVideo(
  photos: string[],
  framesPerShot: string[][],
  shotCount: ShotCount,
  frame: FrameOption,
  filter: FilterType = 'normal'
): Promise<{ blob: Blob; dataUrl: string }> {
  if (!photos || photos.length === 0) {
    throw new Error('No photos available to create Video');
  }

  const fullLayout = getStripLayout(shotCount);
  const width = 480;
  const scale = width / fullLayout.width;
  const height = Math.round(fullLayout.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const loadedSlotsImgs: HTMLImageElement[][] = [];
  for (let i = 0; i < shotCount; i++) {
    const rawFrames =
      framesPerShot[i] && framesPerShot[i].length > 0
        ? framesPerShot[i]
        : photos[i]
        ? [photos[i]]
        : [photos[0]];
    const loaded = await Promise.all(rawFrames.map((s) => loadImage(s)));
    loadedSlotsImgs.push(loaded);
  }

  let mimeType = 'video/webm';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    mimeType = 'video/webm;codecs=vp9';
  }

  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    };
  });

  recorder.start();

  const loops = 2;
  const totalFrames = 18;
  const chinY = height - 90 * scale;

  for (let l = 0; l < loops; l++) {
    for (let t = 0; t < totalFrames; t++) {
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Polaroid Strip Base
      drawPolaroidBackground(ctx, width, height, frame, scale, chinY, t, totalFrames);

      // 2. Draw moving photos inside slots
      for (let i = 0; i < shotCount; i++) {
        const slotImages = loadedSlotsImgs[i];
        if (!slotImages || slotImages.length === 0) continue;

        const img = slotImages[t % slotImages.length];
        const slot = fullLayout.slots[i];
        if (!slot) continue;

        const sx = slot.x * scale;
        const sy = slot.y * scale;
        const sw = slot.w * scale;
        const sh = slot.h * scale;

        const phase = (t / totalFrames) * 2 * Math.PI + i * 1.5;
        const motionZoom = 1.0 + 0.07 * (0.5 + 0.5 * Math.sin(phase));

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 14 * scale);
        ctx.clip();
        ctx.filter = getFilterCss(filter);

        const imgAspect = img.width / img.height;
        const slotAspect = sw / sh;
        let cW = img.width / motionZoom;
        let cH = img.height / motionZoom;
        let cX = (img.width - cW) / 2;
        let cY = (img.height - cH) / 2;

        if (imgAspect > slotAspect) {
          cW = (img.height * slotAspect) / motionZoom;
          cX = (img.width - cW) / 2;
        } else {
          cH = (img.width / slotAspect) / motionZoom;
          cY = (img.height - cH) / 2;
        }

        ctx.translate(sx + sw, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, cX, cY, cW, cH, 0, 0, sw, sh);
        ctx.restore();

        if (frame.theme === 'white-modern') {
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, 14 * scale);
          ctx.stroke();
        }
      }

      ctx.restore();
      await new Promise((r) => setTimeout(r, 65));
    }
  }

  recorder.stop();
  const videoBlob = await recordDone;
  const dataUrl = await blobToDataUrl(videoBlob);

  return { blob: videoBlob, dataUrl };
}
