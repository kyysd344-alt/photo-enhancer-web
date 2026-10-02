# PixelRefine

Web app sederhana untuk penjernih foto dan pengeditan cepat langsung di browser.

## Fitur

- Upload foto dari komputer
- Penyesuaian brightness, contrast, saturation, warmth, grayscale
- Sharpness dan denoise
- Blur dan vignette
- Preset portrait / enhance / cinematic / black & white
- Preview real-time
- Simpan hasil ke file PNG atau JPG

## Jalankan secara lokal

1. Buka folder project di browser dengan server lokal, misalnya:
   ```bash
   python -m http.server 8000
   ```
2. Akses:
   ```text
   http://localhost:8000
   ```

## Struktur file

- `index.html` — UI editor
- `style.css` — tampilan web app
- `app.js` — logika edit foto dan preview

## Catatan

Aplikasi ini dibuat dengan HTML, CSS, dan JavaScript murni agar mudah dijalankan tanpa install dependency besar.

Untuk upgrade ke versi yang lebih kompleks di masa depan, bisa ditambahkan fitur seperti crop manual, rotate, AI upscaling, atau export format WebP.

