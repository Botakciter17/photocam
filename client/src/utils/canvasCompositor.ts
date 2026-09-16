import { ShotCount, FrameOption, FilterType } from '../types/photobooth';

export interface SlotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StripDimensions {
  width: number;
  height: number;
  slots: SlotRect[];
}

/**
 * Calculates portrait polaroid strip dimensions and landscape photo slots stacked vertically (baris kebawah).
 */
export function getStripLayout(count: ShotCount): StripDimensions {
  const width = 1200;
  const marginX = 80;
  const marginTop = 80;
  const slotW = width - 2 * marginX; // 1040 px (Landscape width)
  const chin = 190; // Bottom polaroid footer chin

  let slotH = 585; // 16:9 landscape height (1040 * 9/16)
  let gap = 40;

  if (count === 1) {
    slotH = 650;
    const height = marginTop + slotH + chin;
    return {
      width,
      height,
      slots: [{ x: marginX, y: marginTop, w: slotW, h: slotH }]
    };
  }

  if (count === 2) {
    slotH = 585;
    gap = 45;
    const height = marginTop + 2 * slotH + gap + chin;
    return {
      width,
      height,
      slots: [
        { x: marginX, y: marginTop, w: slotW, h: slotH },
        { x: marginX, y: marginTop + slotH + gap, w: slotW, h: slotH }
      ]
    };
  }

  if (count === 3) {
    slotH = 580;
    gap = 38;
    const height = marginTop + 3 * slotH + 2 * gap + chin;
    return {
      width,
      height,
      slots: [
        { x: marginX, y: marginTop, w: slotW, h: slotH },
        { x: marginX, y: marginTop + slotH + gap, w: slotW, h: slotH },
        { x: marginX, y: marginTop + (slotH + gap) * 2, w: slotW, h: slotH }
      ]
    };
  }

  // count === 4
  slotH = 560;
  gap = 35;
  const height = marginTop + 4 * slotH + 3 * gap + chin;
  return {
    width,
    height,
    slots: [
      { x: marginX, y: marginTop, w: slotW, h: slotH },
      { x: marginX, y: marginTop + slotH + gap, w: slotW, h: slotH },
      { x: marginX, y: marginTop + (slotH + gap) * 2, w: slotW, h: slotH },
      { x: marginX, y: marginTop + (slotH + gap) * 3, w: slotW, h: slotH }
    ]
  };
}

/**
 * Returns CSS filter string for a given filter type.
 */
export function getFilterCss(filter: FilterType): string {
  switch (filter) {
    case 'bw':
      return 'grayscale(100%) contrast(115%) brightness(98%)';
    case 'vintage':
      return 'sepia(65%) contrast(105%) brightness(95%) saturate(120%)';
    case 'normal':
    default:
      return 'none';
  }
}

/**
 * Helper to load an image source into an HTMLImageElement promise.
 */
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

/**
 * Composites multiple landscape webcam photos into a single vertical Portrait Polaroid Strip.
 * Each photo is landscape and stacked vertically downwards.
 */
export async function createCompositePhoto(
  photos: string[],
  shotCount: ShotCount,
  frame: FrameOption,
  filter: FilterType = 'normal'
): Promise<string> {
  const layout = getStripLayout(shotCount);
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  const isLight = frame.theme === 'white-modern';

  // 1. Draw solid background polaroid card
  ctx.fillStyle = isLight ? '#FFFFFF' : '#0F172A';
  ctx.fillRect(0, 0, layout.width, layout.height);

  // 2. Load all captured shot images
  const loadedPhotos = await Promise.all(
    photos.slice(0, shotCount).map((src) => loadImage(src))
  );

  // 3. Draw Film Sprocket Holes if theme is 'film-strip'
  if (frame.theme === 'film-strip') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, layout.width, layout.height);

    ctx.fillStyle = '#FFFFFF';
    const holeW = 32;
    const holeH = 22;
    const holeR = 5;
    const stepY = 48;
    const totalHoles = Math.floor((layout.height - 40) / stepY);

    for (let i = 0; i < totalHoles; i++) {
      const curY = 30 + i * stepY;
      // Left side holes
      ctx.beginPath();
      ctx.roundRect(24, curY, holeW, holeH, holeR);
      ctx.fill();

      // Right side holes
      ctx.beginPath();
      ctx.roundRect(layout.width - 24 - holeW, curY, holeW, holeH, holeR);
      ctx.fill();
    }
  }

  // 4. Render each landscape photo stacked downwards (mirrored + filter)
  for (let i = 0; i < loadedPhotos.length; i++) {
    const img = loadedPhotos[i];
    const slot = layout.slots[i];
    if (!slot) continue;

    ctx.save();

    // Clip to slot boundary with clean rounded corners
    ctx.beginPath();
    const r = 16;
    ctx.roundRect(slot.x, slot.y, slot.w, slot.h, r);
    ctx.clip();

    // Apply color filter
    ctx.filter = getFilterCss(filter);

    // Calculate crop for object-fit: cover
    const imgAspect = img.width / img.height;
    const slotAspect = slot.w / slot.h;
    let sW = img.width;
    let sH = img.height;
    let sX = 0;
    let sY = 0;

    if (imgAspect > slotAspect) {
      sW = img.height * slotAspect;
      sX = (img.width - sW) / 2;
    } else {
      sH = img.width / slotAspect;
      sY = (img.height - sH) / 2;
    }

    // Draw mirrored horizontally (WYSIWYG selfie mirror)
    ctx.translate(slot.x + slot.w, slot.y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, slot.w, slot.h);

    ctx.restore();

    // 5. Theme specific border overlay around each landscape photo
    if (frame.theme === 'white-modern') {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 16);
      ctx.stroke();
    } else if (frame.theme === 'retro-neon') {
      const grad = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.w, slot.y + slot.h);
      grad.addColorStop(0, '#06B6D4');
      grad.addColorStop(0.5, '#8B5CF6');
      grad.addColorStop(1, '#EC4899');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 16);
      ctx.stroke();

      // Corner accent brackets
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(slot.x + 30, slot.y);
      ctx.lineTo(slot.x, slot.y);
      ctx.lineTo(slot.x, slot.y + 30);
      ctx.stroke();

      ctx.strokeStyle = '#EC4899';
      ctx.beginPath();
      ctx.moveTo(slot.x + slot.w - 30, slot.y + slot.h);
      ctx.lineTo(slot.x + slot.w, slot.y + slot.h);
      ctx.lineTo(slot.x + slot.w, slot.y + slot.h - 30);
      ctx.stroke();
    } else if (frame.theme === 'minimal-dark') {
      // Elegant gold foil double border
      const goldGrad = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.w, slot.y + slot.h);
      goldGrad.addColorStop(0, '#F59E0B');
      goldGrad.addColorStop(0.5, '#FCD34D');
      goldGrad.addColorStop(1, '#B45309');

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4, 16);
      ctx.stroke();
    } else if (frame.theme === 'film-strip') {
      // Golden exposure index beside each film shot
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`▶ 0${i + 1}A`, slot.x + slot.w - 90, slot.y + slot.h + 26);
    }
  }

  // 6. Bottom Chin Footer (Classic Polaroid Stamp & Date)
  ctx.save();
  const chinY = layout.height - 95;

  if (frame.theme === 'white-modern') {
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('PHOTOBOOTH • POLAROID', layout.width / 2, chinY);

    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillText(dateStr.toUpperCase(), layout.width / 2, chinY + 36);
  } else if (frame.theme === 'film-strip') {
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('KODAK COLORPLUS 200 • 35MM EXPOSURE', layout.width / 2, chinY + 15);
  } else if (frame.theme === 'retro-neon') {
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#F43F5E';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERPUNK NIGHTS // 2026', layout.width / 2, chinY + 15);
  } else {
    // Minimal Dark Gold
    ctx.font = 'italic 26px "Georgia", serif';
    ctx.fillStyle = '#FCD34D';
    ctx.textAlign = 'center';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    ctx.fillText(`— Memoir Collection • ${dateStr} —`, layout.width / 2, chinY + 15);
  }
  ctx.restore();

  // 7. Export high-quality JPEG
  return canvas.toDataURL('image/jpeg', 0.95);
}
