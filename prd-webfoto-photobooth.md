# PRD — Web Foto (Photobooth dengan Hand Tracking Navigation)

## 1. Ringkasan
Web aplikasi photobooth berbasis browser desktop/kiosk. Pengguna berfoto ala photobox dengan pilihan frame landscape, seluruh interaksi dikendalikan penuh lewat hand tracking (fist gesture untuk seleksi, tanpa mouse/keyboard), dan hasil foto diunduh via scan QR code melalui server lokal LAN/Wi-Fi.

## 2. Latar Belakang & Masalah
- Fotobox fisik konvensional butuh perlengkapan mahal (kamera DSLR, printer thermal, touchscreen/controller).
- User menginginkan pengalaman interaktif dengan "wow factor" melalui kendali gestur tangan.
- Distribusi instan tanpa antrean cetak via QR code lokal yang cepat dan andal meski tanpa internet publik.

## 3. Tujuan (Goals)
- Pengguna menyelesaikan alur sesi foto (pilih shot → capture → preview → download) 100% menggunakan kendali gestur tangan.
- Durasi total dari buka web hingga tampil QR code < 2 menit.
- Download foto via scan QR code selesai dalam < 5 detik via jaringan lokal.
- Nol false-trigger saat pengguna berpose di depan kamera.

## 4. Target User & Setup Lingkungan
- **Target User:** Pengunjung acara/event (bazar, pameran, booth event, pop-up store).
- **Hardware:** PC/laptop desktop dengan layar besar / monitor kiosk dan webcam (min. 720p, rekomendasi 1080p).
- **Jaringan:** Router Wi-Fi / hotspot lokal di lokasi event (kiosk dan HP pengguna berada dalam 1 subnet LAN yang sama).

## 5. Spesifikasi Interaksi & Hand Tracking

### 5.1 Rules Hand Tracking
- **Model Tracking:** MediaPipe Hands (client-side di browser via WebRTC `getUserMedia`).
- **Multi-Person Priority:** Jika terdeteksi > 1 tangan di kamera, sistem mengunci kendali pada tangan dengan bounding box terbesar (posisi terdekat ke kamera).
- **Freeze Mode saat Foto:** Hand tracking di-nonaktifkan total (freeze) begitu countdown (3-2-1) dimulai sampai jepret capture selesai. Hal ini mencegah pose foto user memicu klik/navigasi yang tidak disengaja.

### 5.2 Gesture Set
- **Kursor Gerak (Hover):** Tangan terbuka / jari telunjuk menunjuk. Kursor virtual mengikuti posisi landmark tangan di layar secara mirrored (WYSIWYG).
- **Select / Klik (Fist Gesture):** Mengepalkan tangan (fist). Saat kepalan terdeteksi stabil (threshold ~300ms), aksi klik terpicu.
- **Feedback Visual:** Kursor berubah warna/ikon saat status berubah dari telapak terbuka ke kepalan tangan, disertai animasi ripple/click.
- **Standby & Fallback:** Jika tangan tidak terdeteksi selama 10 detik di tengah alur, tampil overlay petunjuk visual ("Angkat tangan ke depan kamera"). Jika idle tanpa deteksi tangan mencapai 45 detik, sesi auto-reset ke standby screen.

## 6. Scope Fitur Photobooth

### 6.1 Mode & Alur Foto
- **Pilih Jumlah Shot:** Pilihan 1, 3, atau 4 shot (seleksi via gestur kepal).
- **Pilih Frame:** Galeri frame bertema landscape (rasio 16:9 / 4R landscape).
- **Countdown & Capture:** Hitung mundur visual 3-2-1 di layar, audio beep countdown, freeze tracking, capture frame dari webcam. Diulang sesuai jumlah shot yang dipilih.
- **Preview & Retake Parsial:**
  - Menampilkan hasil composite (foto + frame overlay).
  - Menampilkan thumbnail tiap shot. Pengguna bisa mengarahkan kursor ke thumbnail tertentu lalu mengepalkan tangan untuk retake hanya foto tersebut.
  - Opsi tombol "Selesai" untuk lanjut ke QR code.
- **Mirroring:** Tampilan live preview dan hasil akhir foto bersifat mirrored (konsisten WYSIWYG seperti melihat cermin).

### 6.2 Output Kanvas & Frame
- **Orientasi:** Landscape.
- **Resolusi Output:** 1920x1080 (16:9) atau 1800x1200 (4R landscape 3:2), format JPEG/PNG.
- **Compositing:** HTML5 Canvas API merender layer foto webcam di layer bawah dan file PNG frame transparan di layer atas.
- **Fitur Dibalik Layar (BTS GIF & MP4):** Rangkaian foto otomatis di-encode menjadi animasi GIF looping dan video klip MP4 yang dapat diunduh pengguna bersama foto polaroid.

### 6.3 Local Backend & QR Download
- **Arsitektur:** Backend lokal berbasis Node.js (Express).
- **Penyimpanan:** File komposit disimpan sementara di folder lokal server (`/storage/photos/<session-token>.jpg`).
- **QR Code:** Di-generate di client/server berisi URL akses lokal, format: `http://<IP-LAN-KIOSK>:<PORT>/download/<session-token>`.
- **Retensi Data:** File foto disimpan permanen di disk server/VPS (`/storage/photos/<session-token>.jpg`) agar tautan unduhan dan QR code dapat diakses selamanya oleh pengguna kapan saja.

## 7. Alur Pengguna (User Flow)
1. **Standby Screen:** Layar menampilkan animasi ajakan "Angkat tangan untuk mulai".
2. **Hand Detected:** User mengangkat tangan → kursor virtual muncul dan mengunci tangan terdekat.
3. **Pilih Shot:** User memilih jumlah shot (1/3/4) dengan mengarahkan kursor dan mengepalkan tangan.
4. **Pilih Frame:** User memilih template frame landscape.
5. **Sesi Foto:**
   - Sistem hitung mundur 3-2-1 (tracking freeze).
   - Jepret capture shot 1.
   - Jika > 1 shot, jeda 2 detik persiapan lalu countdown shot berikutnya hingga selesai.
6. **Layar Preview:**
   - Hasil foto komposit tampil utuh.
   - User dapat memilih foto tertentu untuk retake parsial, atau pilih "Selesai".
7. **Layar Download:**
   - QR code lokal tampil di layar bersama countdown idle sesi (45 detik).
   - User scan QR via HP di Wi-Fi yang sama → halaman download terbuka → simpan foto.
8. **Reset:** Sesi selesai atau timeout 45 detik → sistem kembali ke Standby Screen.

## 8. Kebutuhan Teknis
- **Frontend:** Single Page App (Vite/React atau Vanilla JS + HTML5 Canvas), Tailwind CSS.
- **Tracking:** `@mediapipe/camera_utils` & `@mediapipe/hands` (WebAssembly/GPU accelerated).
- **Backend:** Node.js, Express, `qrcode` library, static file serving.
- **Network Discovery:** Skrip deteksi IP lokal otomatis pada startup backend agar QR code selalu menunjuk ke IP LAN aktif.

## 9. Non-Functional Requirements
- **Tracking Latency:** Framerate hand tracking ≥ 25 FPS pada hardware standar.
- **Offline Reliability:** Sistem berjalan 100% tanpa sambungan internet luar (cukup router lokal).
- **Privasi:** Foto terisolasi di disk lokal kiosk, terhapus permanen otomatis dalam 1 jam, tanpa tracking analitik pihak ketiga.

## 10. Metrik Keberhasilan
- Tingkat keberhasilan sesi mandiri tanpa mouse/keyboard ≥ 90%.
- False trigger rate saat capture foto = 0%.
- Waktu respons scan QR hingga gambar terbuka di HP < 3 detik via LAN.
