import { ShotCount, FrameOption, FilterType } from '../types/photobooth';
import { getStripLayout, getFilterCss } from './canvasCompositor';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

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

  // 1. Background Card
  ctx.fillStyle = isLight ? '#FFFFFF' : '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // 2. Film Strip Sprockets
  if (frame.theme === 'film-strip') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FFFFFF';
    const holeW = 36 * scale;
    const holeH = 24 * scale;
    const holeR = 5 * scale;
    const stepY = 52 * scale;
    const totalHoles = Math.floor((height - 20 * scale) / stepY);

    for (let i = 0; i < totalHoles; i++) {
      const curY = 15 * scale + i * stepY;
      ctx.beginPath();
      ctx.roundRect(12 * scale, curY, holeW, holeH, holeR);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(width - 12 * scale - holeW, curY, holeW, holeH, holeR);
      ctx.fill();
    }
  }

  // 3. Top "REC ● LIVE VIDEO" Badge
  ctx.save();
  const isBlinkOn = t % 6 < 4;
  ctx.fillStyle = 'rgba(211, 75, 77, 0.95)';
  ctx.beginPath();
  ctx.roundRect(28 * scale, 26 * scale, 190 * scale, 38 * scale, 12 * scale);
  ctx.fill();

  if (isBlinkOn) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(48 * scale, 45 * scale, 6 * scale, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.font = `900 ${Math.round(14 * scale)}px -apple-system, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('LIVE VIDEO', 64 * scale, 49 * scale);
  ctx.restore();

  // 4. Twinkling Sparkles
  const sparklePhase = (t / totalFrames) * 2 * Math.PI;
  drawTwinklingStar(ctx, width - 45 * scale, 42 * scale, 20 * scale, '#FFC800', 0.5 + 0.5 * Math.sin(sparklePhase));
  drawTwinklingStar(ctx, 42 * scale, height - 50 * scale, 18 * scale, '#FFC800', 0.5 + 0.5 * Math.cos(sparklePhase));
  drawTwinklingStar(ctx, width - 40 * scale, height - 70 * scale, 16 * scale, '#D34B4D', 0.5 + 0.5 * Math.sin(sparklePhase + 1.5));

  // 5. Bottom Chin Text
  ctx.save();
  if (frame.theme === 'white-modern') {
    ctx.font = `900 ${Math.round(26 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTOBOOTH • LIVE VIDEO', width / 2, chinY);

    ctx.font = `bold ${Math.round(16 * scale)}px -apple-system, sans-serif`;
    ctx.fillStyle = '#D34B4D';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillText(dateStr.toUpperCase(), width / 2, chinY + 36 * scale);
  } else if (frame.theme === 'film-strip') {
    ctx.font = `bold ${Math.round(22 * scale)}px "Courier New", monospace`;
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('KODAK COLORPLUS • LIVE BTS', width / 2, chinY + 14 * scale);
  } else if (frame.theme === 'retro-neon') {
    ctx.font = `900 ${Math.round(24 * scale)}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = '#F43F5E';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERPUNK NIGHTS // LIVE', width / 2, chinY + 14 * scale);
  } else {
    ctx.font = `italic ${Math.round(24 * scale)}px "Georgia", serif`;
    ctx.fillStyle = '#FCD34D';
    ctx.textAlign = 'center';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    ctx.fillText(`— Memoir Live • ${dateStr} —`, width / 2, chinY + 14 * scale);
  }
  ctx.restore();
}

/**
 * Creates an animated video (MP4/WebM) of the Portrait Polaroid Strip.
 * Renders at crisp high resolution (600px width) with smooth 30 FPS recording.
 */
export async function createAnimatedBtsVideo(
  photos: string[],
  framesPerShot: string[][],
  shotCount: ShotCount,
  frame: FrameOption,
  filter: FilterType = 'normal'
): Promise<{ blob: Blob; dataUrl: string; mimeType: string }> {
  if (!photos || photos.length === 0) {
    throw new Error('No photos available to create Video');
  }

  const fullLayout = getStripLayout(shotCount);
  const width = 600; // High resolution crisp rendering
  const scale = width / fullLayout.width;
  const height = Math.round(fullLayout.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Load all images per shot slot
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

  // Determine best supported MIME type for recording
  let mimeType = 'video/webm';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    mimeType = 'video/webm;codecs=vp9';
  }

  const fps = 30;
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4000000 // 4 Mbps high quality
  });
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

  // Render 60 total frames (~2 seconds loop at 30 FPS)
  const totalFrames = 60;
  const chinY = height - 90 * scale;
  const frameIntervalMs = 1000 / fps; // ~33.3ms

  for (let t = 0; t < totalFrames; t++) {
    const startTime = performance.now();
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background & Frame
    drawPolaroidBackground(ctx, width, height, frame, scale, chinY, t, totalFrames);

    // 2. Draw Photo Slots with Live Breathing Motion
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
      const motionZoom = 1.0 + 0.08 * (0.5 + 0.5 * Math.sin(phase));

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 16 * scale);
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
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 16 * scale);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Precise frame pacing for smooth recording
    const elapsed = performance.now() - startTime;
    const wait = Math.max(1, frameIntervalMs - elapsed);
    await new Promise((r) => setTimeout(r, wait));
  }

  recorder.stop();
  const videoBlob = await recordDone;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(videoBlob);
  });

  return { blob: videoBlob, dataUrl, mimeType: videoBlob.type || mimeType.split(';')[0] };
}
