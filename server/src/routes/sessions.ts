import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { savePhoto } from '../storage.js';
import { getLocalIp } from '../network.js';
import { CONFIG } from '../config.js';

export const sessionsRouter = Router();

sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { image, shotCount, frameId, gif, video } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Missing or invalid base64 image data' });
      return;
    }

    const token = crypto.randomUUID();
    const session = await savePhoto(
      token,
      image,
      Number(shotCount) || 1,
      frameId || 'default',
      gif,
      video
    );

    const lanIp = getLocalIp();
    const downloadUrl = `http://${lanIp}:${CONFIG.PORT}/download/${token}`;

    // Generate QR code data URL (High error correction, 400px)
    const qrDataUrl = await QRCode.toDataURL(downloadUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.status(201).json({
      token,
      downloadUrl,
      qrDataUrl,
      lanIp,
      permanent: true,
      hasGif: session.hasGif,
      hasVideo: session.hasVideo
    });
  } catch (err: any) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to process session image' });
  }
});
