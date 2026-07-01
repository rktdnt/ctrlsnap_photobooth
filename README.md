# Photomatics - AI Digital Photobooth 📸✨

Photomatics adalah aplikasi web *full-stack* Photobooth generasi baru. Dilengkapi dengan filter *real-time*, kustomisasi frame, stiker lucu, dan ekspor kualitas tinggi melalui Cloudinary dan generator QR Code asli.

---

## 🚀 Cara Menjalankan Project (Local Development)

Aplikasi ini terbagi menjadi dua bagian: **Backend (FastAPI)** dan **Frontend (React 19 + Vite)**. Keduanya harus dijalankan secara bersamaan di terminal yang berbeda.

### 1. Setup Backend (FastAPI / Python)

Buka terminal baru, lalu masuk ke direktori `backend`:
```powershell
cd c:\Photobooth\photomatics\backend
```

Aktifkan *Virtual Environment*:
```powershell
.\venv\Scripts\Activate.ps1
```
*(Catatan: Jika Anda menggunakan Mac/Linux, gunakan `source venv/bin/activate`)*

Instal semua *dependencies* (jika belum):
```powershell
pip install -r requirements.txt
```

Konfigurasi `.env`:
- Salin file `.env.example` dan ubah namanya menjadi `.env`.
- Isi konfigurasi rahasia `Cloudinary` dan konfigurasi database Anda. *(Secara default, database menggunakan SQLite agar mudah dites secara lokal. Untuk menggunakan MySQL, ikuti instruksi di dalam `.env`)*.

Jalankan Server:
```powershell
uvicorn app.main:app --reload
```
Backend sekarang akan berjalan di **http://127.0.0.1:8000**.

---

### 2. Setup Frontend (React 19 / Vite)

Buka terminal **baru** (biarkan terminal backend tetap berjalan), lalu masuk ke direktori `frontend`:
```powershell
cd c:\Photobooth\photomatics\frontend
```

Instal semua *dependencies*:
```powershell
npm install
```

Jalankan Development Server:
```powershell
npm run dev
```
Frontend sekarang akan berjalan di **http://localhost:3000** (atau http://localhost:5173 bergantung pada output terminal Vite Anda). 

> ⚠️ **PENTING UNTUK AKSES KAMERA:**
> Browser modern mengharuskan akses web kamera dilakukan di lingkungan yang aman (Secure Context). Jika Anda mengaksesnya dari *device* atau HP lain di jaringan lokal, Anda wajib menggunakan protokol HTTPS (misalnya menggunakan `mkcert` atau *reverse proxy* seperti ngrok/localtunnel). Akses dari `localhost` atau `127.0.0.1` akan diizinkan secara default.

---

## 🌟 Fitur Utama
- **Arsitektur SPA 5 View**: *Landing Page*, Pilih Template, Kamera Pintar, Editor Foto, dan Hasil.
- **Kamera Pintar**: Otomatis hitungan mundur menggunakan Web Audio API sintesis. Terdapat mode simulasi *Virtual Subject* jika web kamera tidak tersedia.
- **Editor Canvas Lanjutan**: Memproses filter CSS Live ke `<canvas>`, menghitung rasio aspek otomatis (*aspect-fill/cover*), penempatan bingkai, stiker putar & ubah ukuran, serta render teks beresolusi tinggi dengan *watermark*.
- **Cloud Storage & Database**: Setiap sesi photostrip akan terunggah ke Cloudinary dan riwayat datanya tercatat permanen di dalam Database MySQL/SQLite.
- **Generate QR Asli**: Pembuatan QR code PNG sungguhan di sisi server untuk kemudahan berbagi foto.
