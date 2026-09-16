# Photobooth Kiosk dengan Hand Tracking Navigation

Aplikasi web photobooth hands-free berbasis browser untuk desktop kiosk. Pengguna dapat memilih jumlah shot, memilih frame landscape, berfoto dengan hitung mundur dan freeze tracking, melihat hasil composite, melakukan retake parsial per shot, serta mengunduh hasil foto melalui QR code lokal di jaringan LAN/Wi-Fi yang sama.

---

## 🚀 Fitur Utama
1. **100% Hand Tracking Navigation:**
   - **Kursor Mirrored:** Mengikuti pusat telapak tangan secara halus dengan dynamic EMA filter.
   - **Gestur Kuncup (Pinch / Kuncup Jari):** Kuncupkan semua ujung jari menyentuh jempol (🤌) ditahan 280ms untuk memilih menu/tombol (visual ring progress + audio click).
   - **Multi-Person Priority:** Mengunci tangan dengan area terbesar (paling dekat dengan kamera) untuk mencegah distraksi orang lain.
2. **Freeze Tracking saat Pemotretan:**
   - Tracking dinonaktifkan total saat hitung mundur 3-2-1 dan jepretan kamera agar pose tangan tidak memicu navigasi tidak disengaja.
3. **Pilihan Jumlah Shot & Template Frame:**
   - Pilihan 1, 3, atau 4 foto.
   - 4 Template frame landscape 16:9 (Modern White, Vintage Film 35mm, Cyberpunk Neon, Classic Dark Gold).
4. **Preview & Retake Parsial:**
   - Hasil foto komposit 1920x1080 px ditampilkan langsung.
   - Thumbnail tiap shot dapat dipilih dengan gestur kuncup untuk retake foto tertentu saja.
5. **Fitur Dibalik Layar (BTS GIF & MP4 Video):**
   - Otomatis membuat animasi looping GIF dan video live MP4 dari rangkaian jepretan foto.
   - Dapat dipratinjau dan diunduh langsung dalam format Polaroid JPG, Animasi GIF, maupun Video MP4.
6. **Download via Scan QR Code:**
   - Backend Express melayani unduhan langsung (`http://<DOMAIN_ATAU_IP>:3001/download/<token>`).
   - Foto dan animasi tersimpan permanen di server/VPS agar link QR code dapat diakses selamanya oleh pengguna kapan saja.
7. **Watchdog & Fallback Idle:**
   - 10 detik tanpa tangan: Overlay panduan "Angkat tangan Anda".
   - 45 detik idle: Reset sesi otomatis ke layar Menu Utama (RAM browser dibersihkan untuk pengguna berikutnya).

---

## 📁 Struktur Direktori
```
/home/bagus/HandCamBoth
├── client/                     # Frontend Vite + React + TypeScript + Tailwind
│   ├── public/
│   │   ├── mediapipe/          # Aset model offline MediaPipe Hands
│   │   └── frames/             # Template SVG 16:9 landscape
│   └── src/
│       ├── engine/             # HandTracker, GestureDetector, CursorSmoother, SoundEffects
│       ├── components/         # VirtualCursor, HandWarningOverlay, InteractiveButton
│       ├── views/              # StandbyView, ShotSelectView, FrameSelectView, CaptureView, PreviewView, DownloadView
│       └── utils/              # canvasCompositor (1920x1080), virtualClick
├── server/                     # Backend Node.js Express + TypeScript
│   ├── src/
│   │   ├── network.ts          # Auto-detect IP LAN lokal
│   │   ├── storage.ts          # Simpan foto sementara & purge job (1 jam)
│   │   └── routes/             # POST /api/sessions, GET /download/:token
│   └── storage/photos/         # Penyimpanan lokal sementara
├── prd-webfoto-photobooth.md   # Dokumen PRD
└── package.json                # Workspace root
```

---

## 🛠️ Cara Menjalankan

### 1. Install Dependensi
Jalankan dari direktori utama:
```bash
npm install
```
*(Skrip postinstall akan otomatis menyalin model offline MediaPipe ke folder `client/public/mediapipe/`)*

### 2. Jalankan Mode Pengembangan
Bisa jalankan sekaligus:
```bash
npm run dev
```
Atau jalankan terpisah di 2 terminal:
- **Terminal 1 (Backend):**
  ```bash
  npm run dev:server
  ```
- **Terminal 2 (Frontend):**
  ```bash
  npm run dev:client
  ```

### 3. Akses Kiosk Photobooth
- Buka browser Chrome / Edge di komputer kiosk: `http://localhost:5173`
- Berikan izin akses Webcam.
- Angkat tangan ke depan kamera dan mulai berfoto!
