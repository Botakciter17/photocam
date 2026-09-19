import { Router, Request, Response } from 'express';
import fs from 'fs';
import { getPhotoPath, getVideoFileInfo } from '../storage.js';

export const downloadRouter = Router();

// Mobile landing page for scanning QR (Duolingo Style - Permanent Access with Polaroid Photo & Live Video)
downloadRouter.get('/download/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const photoPath = getPhotoPath(token);
  const videoInfo = getVideoFileInfo(token);

  if (!photoPath) {
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
  const videoUrl = `/api/photos/${token}/video`;

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unduh Foto Polaroid & Video — Photobooth</title>
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
          padding: 10px 14px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          border: 2px solid #E8CEC9;
          border-bottom: 4px solid #D5C2BE;
          border-radius: 14px;
          background: #FFFFFF;
          color: #4B3F3D;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab-btn.active {
          background: #D34B4D;
          color: #FFFFFF;
          border-color: #7E2123;
          border-bottom: 4px solid #7E2123;
        }
        .img-wrapper {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #FDF7F5;
          border: 2px solid #E8CEC9;
          margin-bottom: 20px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 240px;
        }
        .img-wrapper img, .img-wrapper video {
          width: 100%;
          max-height: 70vh;
          object-fit: contain;
          display: block;
          border-radius: 16px;
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
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 17px;
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
          padding: 14px 20px;
          border-radius: 18px;
          font-size: 15px;
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
        <p class="subtitle">Unduh foto polaroid atau klip video live dibalik layar.</p>

        <!-- Preview Switcher Tabs -->
        <div class="tabs">
          <button class="tab-btn ${videoInfo ? '' : 'active'}" id="tab-photo" onclick="switchPreview('photo')">Polaroid (Foto)</button>
          ${videoInfo ? `<button class="tab-btn active" id="tab-video" onclick="switchPreview('video')">Video Live</button>` : ''}
        </div>

        <div class="img-wrapper">
          <img id="preview-photo" src="${photoUrl}" alt="Photobooth Polaroid Strip" style="${videoInfo ? 'display:none;' : ''}" />
          ${videoInfo ? `<video id="preview-video" src="${videoUrl}" autoplay loop muted playsinline controls style="display:block;"></video>` : ''}
        </div>

        <!-- Download Buttons -->
        <div class="button-group">
          ${videoInfo ? `
            <a href="${videoUrl}" download="photobooth-live-${token.slice(0, 8)}.${videoInfo.extension}" class="btn-download">
              SIMPAN VIDEO LIVE (${videoInfo.extension.toUpperCase()})
            </a>
            <a href="${photoUrl}" download="photobooth-${token.slice(0, 8)}.jpg" class="btn-download-secondary">
              SIMPAN POLAROID (JPG)
            </a>
          ` : `
            <a href="${photoUrl}" download="photobooth-${token.slice(0, 8)}.jpg" class="btn-download">
              SIMPAN POLAROID (JPG)
            </a>
          `}
        </div>

        <p class="footer-note">Tautan permanen • Foto & video tersimpan selamanya</p>
      </div>

      <script>
        function switchPreview(type) {
          var btnPhoto = document.getElementById('tab-photo');
          var btnVideo = document.getElementById('tab-video');

          var photoEl = document.getElementById('preview-photo');
          var vidEl = document.getElementById('preview-video');

          if (type === 'photo') {
            if (photoEl) photoEl.style.display = 'block';
            if (vidEl) { vidEl.style.display = 'none'; vidEl.pause(); }
            if (btnPhoto) btnPhoto.classList.add('active');
            if (btnVideo) btnVideo.classList.remove('active');
          } else if (type === 'video') {
            if (vidEl) { vidEl.style.display = 'block'; vidEl.play(); }
            if (photoEl) photoEl.style.display = 'none';
            if (btnVideo) btnVideo.classList.add('active');
            if (btnPhoto) btnPhoto.classList.remove('active');
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

// Direct Video stream & download with HTTP Range Requests support (iOS & Safari friendly)
downloadRouter.get('/api/photos/:token/video', (req: Request, res: Response) => {
  const { token } = req.params;
  const videoInfo = getVideoFileInfo(token);

  if (!videoInfo) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  const { filePath, mimeType, extension } = videoInfo;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Disposition', `attachment; filename="photobooth-live-${token.slice(0, 8)}.${extension}"`);
  res.setHeader('Accept-Ranges', 'bytes');

  // If HTTP Range header is present (mobile browser / iOS video player)
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    });
    file.pipe(res);
  } else {
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  }
});
