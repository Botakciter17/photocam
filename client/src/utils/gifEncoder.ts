/**
 * Pure TypeScript, zero-dependency GIF89a encoder.
 * Based on the standard CompuServe GIF89a specification & Kevin Weiner's LZW implementation.
 * Fast (<100ms), low memory, renders natively across all desktop & mobile browsers.
 */

const HSIZE = 5003; // 80% occupancy for 12-bit LZW table
const EOF = -1;

class BitWriter {
  private buffer: number[] = [];
  private curAcc = 0;
  private curBits = 0;

  public writeBits(val: number, bits: number) {
    this.curAcc |= val << this.curBits;
    this.curBits += bits;
    while (this.curBits >= 8) {
      this.buffer.push(this.curAcc & 0xff);
      this.curAcc >>= 8;
      this.curBits -= 8;
    }
  }

  public flush() {
    if (this.curBits > 0) {
      this.buffer.push(this.curAcc & 0xff);
      this.curAcc = 0;
      this.curBits = 0;
    }
  }

  public getBytes(): number[] {
    this.flush();
    return this.buffer;
  }
}

// 216-color uniform web palette + 40 grayscale ramp = 256 colors
function getGlobalPalette(): number[][] {
  const pal: number[][] = [];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        pal.push([r * 51, g * 51, b * 51]);
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const v = Math.min(255, Math.floor((i / 39) * 255));
    pal.push([v, v, v]);
  }
  return pal;
}

const PALETTE = getGlobalPalette();

function quantizePixel(r: number, g: number, b: number): number {
  const qr = Math.min(5, Math.floor((r + 25) / 51));
  const qg = Math.min(5, Math.floor((g + 25) / 51));
  const qb = Math.min(5, Math.floor((b + 25) / 51));
  return qr * 36 + qg * 6 + qb;
}

/**
 * Encodes indexed pixel stream using standard GIF LZW.
 */
function lzwEncode(pixels: Uint8Array, colorDepth: number): Uint8Array {
  const initCodeSize = Math.max(2, colorDepth);
  const clearCode = 1 << initCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = initCodeSize + 1;
  let maxCode = (1 << codeSize) - 1;

  const htab = new Int32Array(HSIZE);
  const codetab = new Int32Array(HSIZE);

  function resetTable() {
    htab.fill(-1);
    codetab.fill(-1);
  }

  const bitWriter = new BitWriter();
  resetTable();

  bitWriter.writeBits(clearCode, codeSize);

  let freeEnt = clearCode + 2;
  let ent = pixels[0];

  for (let i = 1; i < pixels.length; i++) {
    const c = pixels[i];
    const fcode = (c << 12) + ent;
    let h = (c << 4) ^ ent;
    if (h >= HSIZE) h -= HSIZE;

    let hit = false;
    let disp = 1;

    if (htab[h] === fcode) {
      ent = codetab[h];
      continue;
    } else if (htab[h] >= 0) {
      disp = HSIZE - h;
      if (h === 0) disp = 1;
      while (true) {
        h -= disp;
        if (h < 0) h += HSIZE;
        if (htab[h] === fcode) {
          ent = codetab[h];
          hit = true;
          break;
        }
        if (htab[h] < 0) break;
      }
      if (hit) continue;
    }

    bitWriter.writeBits(ent, codeSize);
    ent = c;

    if (freeEnt < 4096) {
      codetab[h] = freeEnt++;
      htab[h] = fcode;
      if (freeEnt > maxCode && codeSize < 12) {
        codeSize++;
        maxCode = (1 << codeSize) - 1;
      }
    } else {
      bitWriter.writeBits(clearCode, codeSize);
      resetTable();
      codeSize = initCodeSize + 1;
      maxCode = (1 << codeSize) - 1;
      freeEnt = clearCode + 2;
    }
  }

  bitWriter.writeBits(ent, codeSize);
  bitWriter.writeBits(eoiCode, codeSize);
  const rawBytes = bitWriter.getBytes();

  // Package into 255-byte sub-blocks
  const output: number[] = [];
  let pos = 0;
  while (pos < rawBytes.length) {
    const chunkSize = Math.min(255, rawBytes.length - pos);
    output.push(chunkSize);
    for (let j = 0; j < chunkSize; j++) {
      output.push(rawBytes[pos + j]);
    }
    pos += chunkSize;
  }
  output.push(0); // Sub-block terminator

  return new Uint8Array(output);
}

/**
 * Builds an animated GIF Blob from an array of canvas ImageData frames.
 */
export function encodeGif(
  frames: ImageData[],
  width: number,
  height: number,
  delayMs: number = 250
): Blob {
  const bytes: number[] = [];

  function writeByte(v: number) {
    bytes.push(v & 0xff);
  }

  function writeWord(v: number) {
    writeByte(v & 0xff);
    writeByte((v >> 8) & 0xff);
  }

  function writeString(s: string) {
    for (let i = 0; i < s.length; i++) {
      writeByte(s.charCodeAt(i));
    }
  }

  // 1. Header
  writeString('GIF89a');

  // 2. Logical Screen Descriptor
  writeWord(width);
  writeWord(height);
  writeByte(0xf7); // Global Color Table (8 bits, 256 colors)
  writeByte(0);    // Background color index
  writeByte(0);    // Pixel aspect ratio

  // 3. Global Color Table (256 * 3 = 768 bytes)
  for (let i = 0; i < 256; i++) {
    const rgb = PALETTE[i] || [0, 0, 0];
    writeByte(rgb[0]);
    writeByte(rgb[1]);
    writeByte(rgb[2]);
  }

  // 4. Netscape 2.0 Looping Extension (infinite loop)
  writeByte(0x21); // Extension Introducer
  writeByte(0xff); // Application Label
  writeByte(11);   // Block Size
  writeString('NETSCAPE2.0');
  writeByte(3);    // Sub-block Size
  writeByte(1);
  writeWord(0);    // Infinite Loop
  writeByte(0);    // Terminator

  const delay100th = Math.max(1, Math.round(delayMs / 10));

  // 5. Frames
  for (let f = 0; f < frames.length; f++) {
    const imgData = frames[f];

    // Graphic Control Extension
    writeByte(0x21);
    writeByte(0xf9);
    writeByte(4);    // Block Size
    writeByte(0x00); // Disposal Method (unspecified), No transparency
    writeWord(delay100th);
    writeByte(0);    // Transparent color index
    writeByte(0);    // Terminator

    // Image Descriptor
    writeByte(0x2c); // Separator
    writeWord(0);    // Left
    writeWord(0);    // Top
    writeWord(width);
    writeWord(height);
    writeByte(0);    // Local color table flag (0 = use global)

    // Quantize RGBA pixels
    const pixelCount = width * height;
    const indexed = new Uint8Array(pixelCount);
    const data = imgData.data;

    for (let p = 0; p < pixelCount; p++) {
      const idx = p * 4;
      indexed[p] = quantizePixel(data[idx], data[idx + 1], data[idx + 2]);
    }

    // LZW Compression
    writeByte(8); // LZW code size
    const lzwData = lzwEncode(indexed, 8);
    for (let b = 0; b < lzwData.length; b++) {
      writeByte(lzwData[b]);
    }
  }

  // 6. Trailer
  writeByte(0x3b);

  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
