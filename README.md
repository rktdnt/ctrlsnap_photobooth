# 📸 Photomatics — AI Digital Photobooth

Aplikasi web photobooth digital untuk mengambil, menghias, dan membagikan foto strip secara online. Dibangun dengan **React 19 + Vite** (frontend) dan **FastAPI** (backend), siap di-deploy sebagai *serverless function* di Vercel.

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Alur Halaman](#-alur-halaman)
- [API Endpoints](#-api-endpoints)
- [Struktur Folder](#-struktur-folder)
- [Mode Sesi](#-mode-sesi)
- [Troubleshooting](#-troubleshooting)
- [Scripts yang Tersedia](#-scripts-yang-tersedia)
- [Catatan Keamanan & Status Backend](#-catatan-keamanan--status-backend)
- [Kontribusi](#-kontribusi)

---

## ✨ Fitur

| Mode | Fitur |
|---|---|
| 🆓 **Trial** | Ambil foto single frame, filter dasar, hasil ada watermark |
| 💎 **Premium** | Semua layout (1x1, 1x3, 1x4, 2x2), semua frame, kustomisasi warna & background sendiri, bebas watermark, QR download HD |
| 🤖 **Umum** | Kamera pintar dengan hitung mundur & suara shutter sintesis, mode Virtual Subject jika webcam tidak tersedia, editor stiker/teks drag-and-drop, upload otomatis ke Cloudinary, share via WhatsApp/QR/tautan, riwayat sesi tersimpan di browser |

---

## 🛠️ Teknologi

- **[React 19](https://react.dev/)** — Library UI untuk frontend
- **[Vite](https://vitejs.dev/)** — Build tool & dev server frontend
- **[TypeScript](https://www.typescriptlang.org/)** — JavaScript dengan type checking
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Framework CSS utility-first
- **[FastAPI](https://fastapi.tiangolo.com/)** — Framework backend Python
- **[SQLAlchemy](https://www.sqlalchemy.org/)** — ORM database (SQLite untuk dev, MySQL untuk produksi)
- **[Cloudinary](https://cloudinary.com/)** — Penyimpanan & hosting gambar hasil foto
- **[Vercel](https://vercel.com/)** — Platform deployment (static frontend + Python serverless function)

---

## 📦 Prasyarat

Pastikan sudah terinstall di komputer kamu:

1. **Node.js** versi 18 ke atas → [Download di nodejs.org](https://nodejs.org/)
2. **Python** versi 3.11 ke atas → [Download di python.org](https://www.python.org/)
3. **Git** → [Download di git-scm.com](https://git-scm.com/)
4. *(Opsional)* Akun **Cloudinary** gratis → [cloudinary.com](https://cloudinary.com/) — untuk fitur upload & QR share berfungsi penuh

---

## 🚀 Instalasi

### Langkah 1 — Clone repositori

```bash
git clone https://github.com/rktdnt/Photomatics-Photobooth.git
cd Photomatics-Photobooth
```

### Langkah 2 — Install dependencies Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Langkah 3 — Install dependencies Frontend

```bash
cd ../frontend
npm install
```

> ⏳ Tunggu beberapa menit sampai selesai. Proses ini mengunduh semua library yang dibutuhkan.

---

## 🗄️ Konfigurasi Environment

Buat file **`.env`** di folder `backend/` (atau di root proyek — `config.py` akan mencari di keduanya):

```env
DATABASE_URL=sqlite:///./photomatics.db
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_ORIGIN=http://localhost:3000
APP_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

> ⚠️ Untuk produksi, ganti `DATABASE_URL` ke koneksi MySQL, contoh:
> `mysql+pymysql://USER:PASSWORD@HOST:3306/NAMA_DATABASE`

Buat juga file **`.env`** di folder `frontend/` untuk fitur upload & QRIS di sisi klien:

```env
VITE_CLOUDINARY_CLOUD_NAME=nama_cloud_kamu
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
VITE_STATIC_QRIS=
```

---

## ▶️ Menjalankan Aplikasi

### Langkah 1 — Jalankan Backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --reload
```

Output yang benar:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Backend berjalan di **http://127.0.0.1:8000**.

### Langkah 2 — Jalankan Frontend (Vite)

Buka terminal **baru** (biarkan backend tetap berjalan):

```bash
cd frontend
npm run dev
```

Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

> ⚠️ **Akses kamera** butuh HTTPS (*secure context*) jika dibuka dari perangkat lain di jaringan lokal. Akses dari `localhost`/`127.0.0.1` diizinkan langsung oleh browser.

---

## 🌐 Alur Halaman

Aplikasi ini adalah *Single Page Application* (SPA) tanpa routing berbasis URL — perpindahan tampilan diatur lewat state React di `App.tsx`.

| Tampilan | Komponen | Keterangan |
|---|---|---|
| Landing | `LandingPage.tsx` | Halaman awal, fitur, demo, testimoni, pilihan harga |
| Selector | `TemplateSelector.tsx` | Pilih layout & frame, pratinjau kamera, pembayaran QRIS (mode Premium) |
| Photobooth | `Photobooth.tsx` | Sesi pengambilan foto dengan hitung mundur otomatis |
| Editor | `PhotoEditor.tsx` | Hias foto: filter, stiker, teks, frame custom |
| Result | `ResultPage.tsx` | Unduh, share QR/WhatsApp/tautan, riwayat sesi |
| Shared | `SharedResultPage.tsx` | Tampil saat membuka tautan `?share=` dari orang lain |

---

## 📡 API Endpoints

Backend FastAPI (`backend/app/`) menyediakan endpoint berikut. Semua mengembalikan JSON.

> ⚠️ **Status saat ini**: hanya endpoint di `main.py` yang aktif secara *default*. Endpoint di `routers/` sudah lengkap kodenya tapi **belum didaftarkan** (`include_router`) ke aplikasi utama.

### ✅ Aktif (di `main.py`)

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/` | Health check — pesan selamat datang API |
| `POST` | `/api/ai/remove-background` | Stub penghapusan background (masih mengembalikan gambar asli) |

### 🔧 Tersedia di kode, belum terhubung (`routers/`)

| Method | URL (prefix disarankan) | File | Keterangan |
|---|---|---|---|
| `POST` | `/api/sessions` | `sessions.py` | Simpan record sesi foto baru ke database |
| `GET` | `/api/sessions?device_id=...` | `sessions.py` | Ambil riwayat sesi berdasarkan perangkat |
| `DELETE` | `/api/sessions/:id` | `sessions.py` | Hapus (soft delete) record sesi |
| `POST` | `/api/upload` | `upload.py` | Upload gambar base64 ke Cloudinary |
| `POST` | `/api/qrcode` | `qrcode_gen.py` | Generate QR code PNG asli dari sebuah URL |
| `POST` | `/api/media/gif` | `media.py` | Placeholder pembuatan GIF/boomerang |
| `POST` | `/api/ai-tools/remove-background` | `ai_tools.py` | Placeholder penghapusan background (versi router) |

---

## 📁 Struktur Folder

```
Photomatics-Photobooth/
│
├── api/                         ← Entry point serverless (Vercel)
│   ├── index.py                 ← Import app FastAPI dari backend/
│   └── requirements.txt
│
├── backend/                     ← Backend FastAPI (mode standalone/Docker)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              ← Entry point FastAPI + CORS + endpoint aktif
│       ├── config.py            ← Load .env (DB, Cloudinary, origin)
│       ├── database.py          ← Setup koneksi SQLAlchemy (SQLite/MySQL)
│       ├── models.py            ← Model ORM PhotoSession
│       ├── schemas.py           ← Skema Pydantic request/response
│       ├── routers/             ← Endpoint per-fitur (belum di-include)
│       │   ├── sessions.py      ← CRUD riwayat sesi
│       │   ├── upload.py        ← Upload gambar ke Cloudinary
│       │   ├── qrcode_gen.py    ← Generate QR code
│       │   ├── media.py         ← Pembuatan GIF (placeholder)
│       │   └── ai_tools.py      ← Remove background (placeholder)
│       └── services/            ← Logika bisnis / integrasi pihak ketiga
│           ├── cloudinary_service.py
│           └── qrcode_service.py
│
├── frontend/                    ← Aplikasi React (SPA)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/images/           ← Aset gambar statis landing page
│   └── src/
│       ├── main.tsx             ← Entry point React
│       ├── App.tsx              ← State global & routing antar-view
│       ├── index.css            ← Tema warna & style global
│       ├── types.ts             ← Tipe TypeScript + data preset (layout, frame, filter, stiker)
│       ├── components/
│       │   ├── LandingPage.tsx
│       │   ├── TemplateSelector.tsx
│       │   ├── Photobooth.tsx
│       │   ├── PhotoEditor.tsx
│       │   ├── ResultPage.tsx
│       │   └── SharedResultPage.tsx
│       └── utils/
│           └── qris.ts          ← Generator QRIS dinamis (CRC16 manual)
│
└── vercel.json                  ← Routing build frontend + serverless backend
```

---

## 🎟️ Mode Sesi

Aplikasi ini tidak memakai akun/login — melainkan dua **mode sesi** yang dipilih pengguna di halaman awal:

| Mode | Harga | Batasan |
|---|---|---|
| 🆓 Trial | Rp 0 | 1 foto (single frame), filter dasar, watermark tetap ada |
| 💎 Premium | Rp 10.000 | Semua layout & frame, kustomisasi warna/background sendiri, tanpa watermark, dibayar via QRIS dinamis (simulasi verifikasi otomatis) |

> ⚠️ Verifikasi pembayaran QRIS saat ini **disimulasikan** di frontend (`setTimeout`) — belum terhubung ke payment gateway sungguhan.

---

## 🔧 Troubleshooting

### ❌ Error: "Failed to access camera"

**Penyebab**: Browser tidak mengizinkan akses kamera (bukan HTTPS/localhost) atau tidak ada webcam.

**Solusi**:
1. Pastikan mengakses lewat `http://localhost:3000`, bukan alamat IP jaringan
2. Jika tetap gagal, aplikasi otomatis pindah ke **Virtual Mode** (gambar simulasi)
3. Untuk akses dari HP/perangkat lain, gunakan HTTPS (mis. `ngrok` atau `mkcert`)

---

### ❌ Error: "Module not found" saat `npm run dev`

**Solusi**:
```bash
cd frontend
npm install
```

---

### ❌ Port 3000 sudah dipakai

**Solusi**: Jalankan di port lain:
```bash
npm run dev -- --port 3001
```

---

### ❌ Upload / QR tidak muncul di halaman hasil

**Kemungkinan penyebab**: `VITE_CLOUDINARY_CLOUD_NAME` belum diisi di `frontend/.env`.

**Solusi**: Isi variabel tersebut, lalu restart `npm run dev`. Tanpa konfigurasi ini, aplikasi tetap berjalan dengan fallback data URL lokal (gambar tidak ter-upload ke cloud).

---

### ✅ Cek Status Backend

Buka URL ini di browser:
```
http://127.0.0.1:8000/
```

Jika berhasil, responnya:
```json
{ "message": "Welcome to Photomatics API" }
```

---

## 📜 Scripts yang Tersedia

| Perintah | Lokasi | Fungsi |
|---|---|---|
| `npm run dev` | `frontend/` | Jalankan dev server Vite (port 3000, hot reload) |
| `npm run build` | `frontend/` | Build frontend untuk production (`tsc -b && vite build`) |
| `npm run preview` | `frontend/` | Preview hasil build production |
| `uvicorn app.main:app --reload` | `backend/` | Jalankan server FastAPI dengan hot reload |
| `docker build -t photomatics-backend .` | `backend/` | Build image Docker backend |

---

## 🔐 Catatan Keamanan & Status Backend

- ⚠️ Router `sessions`, `upload`, `qrcode_gen`, `media`, `ai_tools` **belum** didaftarkan di `main.py` — perlu `app.include_router(...)` untuk mengaktifkannya.
- ⚠️ Skema `UploadResponse` dirujuk oleh `routers/upload.py` tapi belum didefinisikan di `schemas.py`.
- ⚠️ Saat ini upload gambar, generate QR, dan riwayat sesi berjalan **langsung dari browser** (Cloudinary unsigned upload, `api.qrserver.com`, `localStorage`/cookie) — bukan lewat backend ini. Migrasikan ke backend bila butuh kontrol keamanan/kredensial lebih baik.
- ⚠️ `routers/media.py` (GIF/boomerang) dan `routers/ai_tools.py` (remove background) masih **placeholder**, belum ada logika sungguhan.
- ✅ CORS sudah dikonfigurasi lewat `FRONTEND_ORIGIN` di `config.py`.
- ✅ File `.env` tidak ikut ter-commit ke Git (lihat `.gitignore`).

---

## 🤝 Kontribusi

1. Fork repositori ini
2. Buat branch baru: `git checkout -b fitur-saya`
3. Commit perubahan: `git commit -m "Tambah fitur X"`
4. Push: `git push origin fitur-saya`
5. Buat Pull Request

---

*Dibuat dengan ❤️ menggunakan React + FastAPI*