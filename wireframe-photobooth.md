# Wireframe Spec — Photobooth Mode

> Fidelity: low-fi wireframe (struktur & flow, bukan visual design final).
> Platform: desktop web.
> Tujuan file: deskripsi terstruktur biar bisa dipakai AI/tool lain (Figma AI, v0, dsb) buat generate UI.

---

## Ringkasan Flow

```
[1. Setup] --(klik "Mulai Sesi Foto")--> [2. Capture] --(auto, semua jepretan selesai)--> [3. Preview/Retake]
                                                                                              |
                                          (retake satu/semua) <--------------------------------
                                                                                              |
                                                                          (klik "Lanjut - Simpan Hasil")
                                                                                              v
                                                                                     [4. QR Download]
```

4 layar, linear dengan satu loop balik (retake) di layar 3.

---

## Screen 1 — Setup

**Tujuan:** user menentukan parameter sesi foto sebelum mulai jepret.

### Layout (ASCII)
```
+--------------------------------------------------------------+
| < Kembali        Photobooth - Atur Sesi         Galeri (3)   |
+--------------------------------------------------------------+
|                              |  Mau foto berapa kali?         |
|                              |  [1] [2] [3*] [4]              |
|      LIVE CAMERA PREVIEW     |  (*terpilih)                   |
|      + frame overlay         |                                 |
|      (dashed border)         |  Jeda per jepretan              |
|                              |  [3s] [5s*] [10s]               |
|                              |                                 |
|                              |  Filter                         |
|                              |  [Normal*] [B&W] [Vintage]      |
|                              |                                 |
|                              |  Frame                          |
|                              |  [thumb][thumb][thumb][thumb]   |
|                              |                                 |
|                              |  [ Mulai Sesi Foto ] (primary)  |
+--------------------------------------------------------------+
```

### Komponen
- `camera_preview` — live feed kamera, area kiri, ~65% lebar
- `frame_overlay` — border putus-putus di dalam preview, representasi frame terpasang, update real-time saat frame diganti
- `shot_count_selector` — pilihan 1/2/3/4, single-select, default 3
- `delay_selector` — pilihan 3s/5s/10s, single-select, default 5s
- `filter_selector` — pilihan Normal/B&W/Vintage, single-select, default Normal
- `frame_selector` — strip horizontal thumbnail frame, single-select
- `start_button` — CTA utama, primary style, disabled kalau kamera belum granted permission

### Interaksi
- Semua pilihan (shot count, delay, filter, frame) langsung update preview di kiri secara real-time
- Klik `start_button` → pindah ke Screen 2 (Capture) dengan parameter yang udah dipilih

### State
- Default state: kamera belum granted → tampilkan overlay "izinkan akses kamera" di atas preview
- Loaded state: seperti layout di atas

---

## Screen 2 — Capture

**Tujuan:** proses jepret otomatis sesuai jumlah & jeda yang dipilih. Distraction-free, tanpa kontrol setup.

### Layout (ASCII)
```
+--------------------------------------------------------------+
| Batalkan Sesi     Jepretan 2 dari 3      Filter: Normal        |
+--------------------------------------------------------------+
|                                                                |
|                    LIVE CAMERA + FRAME                        |
|                                                                |
|                          [ 3 ]  <- countdown besar             |
|                                                                |
+--------------------------------------------------------------+
|              (✓)      ( 2 )      ( 3 )      <- progress dots  |
+--------------------------------------------------------------+
|      "Bersiap... jepretan otomatis tiap 5 detik"               |
+--------------------------------------------------------------+
```

### Komponen
- `progress_indicator` — total N dots sesuai `shot_count` dari Screen 1
  - state `done`: solid fill, isi centang
  - state `active`: border tebal, isi nomor jepretan
  - state `pending`: outline biasa, isi nomor jepretan
- `countdown_overlay` — angka besar di tengah preview, hitung mundur dari `delay` ke 0
- `cancel_button` — di top bar, batalkan sesi & balik ke Screen 1
- `status_text` — teks bantu di bawah progress dots

### Interaksi
- Countdown jalan otomatis per jepretan, tanpa input user
- Setelah capture ke-N terakhir selesai → auto pindah ke Screen 3
- `cancel_button` bisa dipencet kapan aja selama sesi → balik ke Screen 1, hasil sebelumnya dibuang

### Catatan teknis
- Tidak ada tombol shutter manual — capture sepenuhnya otomatis berbasis timer (perlu dikonfirmasi ke user apakah mau ada opsi manual override)

---

## Screen 3 — Preview & Retake

**Tujuan:** user review hasil, punya opsi retake sebelum lanjut simpan.

### Layout (ASCII)
```
+--------------------------------------------------------------+
| < Ulang dari awal    Hasil Foto Kamu       3 jepretan          |
+--------------------------------------------------------------+
|                          |  Udah oke belum?                    |
|   [ result strip ]       |  (kalau ada yg kurang pas, retake    |
|   [ shot 1 ]              |   satu-satu tanpa ngulang semua)    |
|   [ shot 2 ]              |                                     |
|   [ shot 3 ]              |  Retake jepretan ke-                |
|   nama app - tanggal      |  [1] [2] [3]                        |
|                          |                                      |
|                          |  Ganti frame / filter                |
|                          |  [thumb][thumb][thumb]               |
|                          |                                      |
|                          |  [ Lanjut - Simpan Hasil ] (primary) |
|                          |  [ Retake Semua ] (secondary)        |
+--------------------------------------------------------------+
```

### Komponen
- `result_strip` — kumpulan foto hasil jadi, tersusun vertikal kaya strip photobooth fisik
- `retake_single_selector` — pilih nomor jepretan spesifik buat diulang (bukan semua)
- `retake_all_button` — reset total, balik ke Screen 2 dari jepretan pertama
- `frame_filter_reselect` — masih bisa ganti frame/filter di sini tanpa foto ulang (hanya reprocess overlay)
- `continue_button` — lanjut ke Screen 4, primary CTA

### Interaksi
- Klik `retake_single_selector` pada satu nomor → balik ke Screen 2 tapi cuma capture ulang slot itu, hasil lain tetap
- Klik `retake_all_button` → balik ke Screen 2 dari awal, semua hasil sebelumnya dibuang
- Klik `continue_button` → trigger upload hasil ke server, lanjut ke Screen 4 (kemungkinan perlu loading state singkat sebelum QR siap)

### Pertanyaan terbuka
- Upload ke server terjadi saat klik `continue_button`, atau sudah diam-diam terjadi selama sesi capture? (menentukan perlu/tidaknya loading state di transisi ke Screen 4)

---

## Screen 4 — QR Download

**Tujuan:** user ambil hasil akhir, terutama untuk dipindah ke HP.

### Layout (ASCII)
```
+--------------------------------------------------------------+
| < Kembali ke hasil     Foto Siap Diambil        Selesai        |
+--------------------------------------------------------------+
|                          |     Scan buat simpan ke HP          |
|   [ result strip ]       |     +----------------+              |
|   [ shot 1 ]              |     |                |              |
|   [ shot 2 ]              |     |   QR CODE      |              |
|   [ shot 3 ]              |     |                |              |
|   nama app - tanggal      |     +----------------+              |
|                          |     link aktif 15 menit              |
|                          |     lewat dari itu, foto dihapus      |
|                          |                                      |
|                          |     [ Download Langsung ] (primary)  |
|                          |     [ Salin Link ]                   |
|                          |     [ Foto Lagi ]                    |
+--------------------------------------------------------------+
```

### Komponen
- `qr_code` — encode URL unik menuju hasil foto
- `expiry_notice` — teks masa berlaku link (default: 15 menit, lalu file dihapus dari server)
- `download_button` — download langsung ke device saat ini (browser desktop)
- `copy_link_button` — salin URL hasil, alternatif dari scan QR
- `retry_button` ("Foto Lagi") — mulai sesi baru dari Screen 1

### Interaksi
- QR & link merujuk ke resource yang sama (foto hasil akhir, sudah termasuk frame/filter)
- Setelah expiry, akses link/QR menampilkan pesan "link sudah tidak berlaku"

---

## Ringkasan Komponen Lintas Layar

| Komponen | Muncul di layar |
|---|---|
| `camera_preview` | 1, 2 |
| `frame_overlay` | 1, 2 |
| `result_strip` | 3, 4 |
| `frame_filter_reselect` | 1, 3 |
| Primary CTA button | 1, 3, 4 |

## Catatan untuk Implementasi Lanjut
- Belum dibahas: apakah retake per-jepretan butuh countdown yang sama persis dengan sesi awal
- Belum dibahas: apa yang terjadi kalau user menutup tab di Screen 4 sebelum expiry — apakah link tetap valid
