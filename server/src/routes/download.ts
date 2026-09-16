import { Router, Request, Response } from 'express';
import { getPhotoPath, getGifPath, getVideoPath, getSession } from '../storage.js';

export const downloadRouter = Router();

// Mobile landing page for scanning QR (Duolingo Style - Permanent Access with BTS GIF & MP4)
downloadRouter.get('/download/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const photoPath = getPhotoPath(token);
  const gifPath = getGifPath(token);
  const videoPath = getVideoPath(token);

  if (!photoPath && !gifPath) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Foto Tidak Ditemukan</title>
        <style>
          body { font-family: 'Nunito', -apple-system, sans-serif; background: #FDF7F5; color: #4B3F3D; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: #FFFFFF; padding: 36px 24px; border-radius: 28px; max-width: 400px; border: 3px solid #E8CEC9; border-bottom: 6px solid #D5C2BE; }
          h1 { font-size: 24px; font-weight: 900; color: #D34B4D; margin-bottom: 8px; }
          p { color: #8B7B78; font-size: 14px; font-weight: 700; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Foto Tidak Ditemukan</h1>
          <p>Tautan tidak valid atau foto belum tersimpan.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  const photoUrl = `/api/photos/${token}`;
  const gifUrl = `/api/photos/${token}/gif`;
  const videoUrl = `/api/photos/${token}/video`;

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unduh Foto Polaroid & BTS GIF — Photobooth</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FDF7F5;
          color: #4B3F3D;
          margin: 0;
          padding: 16px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .container {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border: 3px solid #E8CEC9;
          border-bottom: 7px solid #D5C2BE;
          border-radius: 32px;
          padding: 24px 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(211, 75, 77, 0.08);
        }
        .badge {
          display: inline-block;
          background: #FFF0F0;
          color: #D34B4D;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 12px;
          border-radius: 9999px;
          border: 1px solid #E8CEC9;
          margin-bottom: 8px;
        }
        h1 {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 4px 0;
          color: #D34B4D;
          letter-spacing: -0.5px;
        }
        p.subtitle {
          color: #8B7B78;
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }
        .tabs {
          display: flex;
          gap: 8px;
          background: #FDF7F5;
          padding: 4px;
          border-radius: 16px;
          border: 2px solid #E8CEC9;
          margin-bottom: 16px;
        }
        .tab-btn {
          flex: 1;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: #8B7B78;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab-btn.active {
          background: #D34B4D;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(211,75,77,0.3);
        }
        .img-wrapper {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #FDF7F5;
          border: 2px solid #E8CEC9;
          margin-bottom: 20px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }
        .img-wrapper img, .img-wrapper video {
          width: 100%;
          height: auto;
          display: block;
        }
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-download {
          display: block;
          width: 100%;
          background: #D34B4D;
          color: #FFFFFF;
          text-decoration: none;
          padding: 15px 20px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.5px;
          border: none;
          border-bottom: 5px solid #A83234;
          transition: all 0.1s ease;
          box-shadow: 0 4px 15px rgba(211, 75, 77, 0.25);
        }
        .btn-download:active {
          transform: translateY(4px);
          border-bottom-width: 1px;
        }
        .btn-download-secondary {
          display: block;
          width: 100%;
          background: #FFFFFF;
          color: #4B3F3D;
          text-decoration: none;
          padding: 13px 20px;
          border-radius: 18px;
          font-size: 14px;
          font-weight: 900;
          border: 2px solid #E8CEC9;
          border-bottom: 4px solid #D5C2BE;
          transition: all 0.1s ease;
        }
        .btn-download-secondary:active {
          transform: translateY(3px);
          border-bottom-width: 1px;
        }
        .footer-note {
          margin-top: 14px;
          font-size: 11px;
          font-weight: 800;
          color: #A89591;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">Tersimpan Permanen</span>
        <h1>Foto Kamu Siap!</h1>
        <p class="subtitle">Unduh foto polaroid atau klip animasi dibalik layar (BTS).</p>

        <!-- Preview Switcher Tabs -->
        <div class="tabs">
          <button class="tab-btn active" onclick="switchPreview('photo')">Polaroid (Foto)</button>
          ${gifPath ? `<button class="tab-btn" onclick="switchPreview('gif')">Animasi GIF</button>` : ''}
          ${videoPath ? `<button class="tab-btn" onclick="switchPreview('video')">Video Live</button>` : ''}
        </div>

        <div class="img-wrapper">
          <img id="preview-photo" src="${photoUrl}" alt="Photobooth Polaroid Strip" />
          ${gifPath ? `<img id="preview-gif" src="${gifUrl}" alt="Photobooth BTS GIF" style="display:none;" />` : ''}
          ${videoPath ? `<video id="preview-video" src="${videoUrl}" autoplay loop muted playsinline style="display:none;"></video>` : ''}
        </div>

        <!-- Download Buttons -->
        <div class="button-group">
          <a href="${photoUrl}" download="photobooth-${token.slice(0, 8)}.jpg" class="btn-download">
            SIMPAN POLAROID (JPG)
          </a>
          ${gifPath ? `
            <a href="${gifUrl}" download="photobooth-bts-${token.slice(0, 8)}.gif" class="btn-download-secondary">
              SIMPAN ANIMASI (GIF)
            </a>
          ` : ''}
          ${videoPath ? `
            <a href="${videoUrl}" download="photobooth-live-${token.slice(0, 8)}.mp4" class="btn-download-secondary">
              SIMPAN VIDEO LIVE (MP4)
            </a>
          ` : ''}
        </div>

        <p class="footer-note">Tautan permanen • Foto & animasi tersimpan selamanya</p>
      </div>

      <script>
        function switchPreview(type) {
          var btns = document.querySelectorAll('.tab-btn');
          btns.forEach(function(b) { b.classList.remove('active'); });

          var photoEl = document.getElementById('preview-photo');
          var gifEl = document.getElementById('preview-gif');
          var vidEl = document.getElementById('preview-video');

          if (photoEl) photoEl.style.display = 'none';
          if (gifEl) gifEl.style.display = 'none';
          if (vidEl) { vidEl.style.display = 'none'; vidEl.pause(); }

          if (type === 'photo') {
            if (photoEl) photoEl.style.display = 'block';
            btns[0].classList.add('active');
          } else if (type === 'gif') {
            if (gifEl) gifEl.style.display = 'block';
            if (btns[1]) btns[1].classList.add('active');
          } else if (type === 'video') {
            if (vidEl) { vidEl.style.display = 'block'; vidEl.play(); }
            if (btns[2]) btns[2].classList.add('active');
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Direct image download stream (JPG)
downloadRouter.get('/api/photos/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const photoPath = getPhotoPath(token);

  if (!photoPath) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Disposition', `attachment; filename="photobooth-${token.slice(0, 8)}.jpg"`);
  res.sendFile(photoPath);
});

// Direct GIF download stream
downloadRouter.get('/api/photos/:token/gif', (req: Request, res: Response) => {
  const { token } = req.params;
  const gifPath = getGifPath(token);

  if (!gifPath) {
    res.status(404).json({ error: 'GIF not found' });
    return;
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Disposition', `attachment; filename="photobooth-bts-${token.slice(0, 8)}.gif"`);
  res.sendFile(gifPath);
});

// Direct Video download stream (MP4)
downloadRouter.get('/api/photos/:token/video', (req: Request, res: Response) => {
  const { token } = req.params;
  const videoPath = getVideoPath(token);

  if (!videoPath) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="photobooth-live-${token.slice(0, 8)}.mp4"`);
  res.sendFile(videoPath);
});
