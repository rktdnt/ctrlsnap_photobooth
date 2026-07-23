# 🎓 OOP Sesi 5 — Export Action Pattern di CTRL+Snap

Memetakan `BaseExportAction` → `LocalDownloadAction` → `CloudShareAction` → `NativeShareAction` → `PhotoExportManager` ke kode yang benar-benar berjalan di [`ResultPage.tsx`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx).

---

## 1. 🔒 Encapsulation — Data Ekspor Terkunci di State

Konsep: *"Menyimpan data gambar dan konfigurasi pengiriman ke dalam satu Manager agar terkontrol"*

**File:** [ResultPage.tsx L21-L33](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L21-L33)

```typescript
// ─── "PhotoExportManager" dienkapsulasi dalam state komponen ──────
const ResultPage: React.FC<Props> = ({ dataUrl, ... }) => {
  //                                   ↑ analog: private dataUrl di PhotoExportManager

  // Data hasil upload cloud — tersimpan aman, tidak bisa diakses dari luar:
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  //    ↑ analog: "result.url" dari CloudShareAction setelah upload

  const [qrCodeDataUrl, setQrCodeDataUrl]       = useState<string>('');
  //    ↑ data QR terisolasi — hanya bisa di-set via handleShowQR()

  const [isUploading, setIsUploading]           = useState(true);
  //    ↑ status proses upload tersembunyi dari komponen lain

  const [gifDataUrl, setGifDataUrl]             = useState<string>('');
  //    ↑ hasil GIF terisolasi dalam komponen ini saja
};
```

---

## 2. 🎭 Polymorphism — 5 Aksi Ekspor, 1 Pola Fungsi

Semua aksi mengikuti pola yang sama: **dipanggil oleh tombol UI → eksekusi logikanya → hasilkan output berbeda**. Inilah polimorfisme dalam React.

---

### Aksi #1: `LocalDownloadAction` → Download HD Lokal

**File:** [ResultPage.tsx L247-L253](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L247-L253)

```tsx
// ─── "LocalDownloadAction.execute(dataUrl)" ───────────────────────
<a
  href={dataUrl}               // ← dataUrl sebagai sumber gambar
  download="ctrlsnap-strip.jpg" // ← nama file yang akan tersimpan
  className="soft-btn-primary flex w-full ..."
>
  <Download className="w-5 h-5" /> Amankan Kualitas HD ⚡
</a>

// Cara kerja:
// 1. Browser buat link <a> dengan href = dataUrl (Base64 JPEG)
// 2. attribute download= memicu browser menyimpan file
// 3. Tidak butuh server — murni local save!
// ↑ Identik dengan: link.href = dataUrl; link.click(); (di contoh OOP)
```

---

### Aksi #2: `CloudShareAction` → Upload ke Cloudinary

**File:** [ResultPage.tsx L47-L75](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L47-L75)

```typescript
// ─── "CloudShareAction.execute(dataUrl)" ─────────────────────────
const processResult = async () => {
  let finalUrl = dataUrl;       // ← fallback ke lokal jika upload gagal
  setIsUploading(true);         // ← notifikasi UI: proses sedang berjalan

  try {
    const apiBase = getApiBaseUrl();
    const formData = new FormData();
    formData.append('image_base64', dataUrl);  // ← kirim Base64 ke backend

    const resUpload = await fetch(`${apiBase}/api/upload`, {  // ← POST ke backend
      method: 'POST',
      body: formData
    });

    if (resUpload.ok) {
      const uploadData = await resUpload.json();
      finalUrl = uploadData.url;    // ← URL Cloudinary yang didapat
      // ↑ analog: console.log("Foto siap dibagikan di URL:", result.url)
    }
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    // Graceful fallback: pakai dataUrl lokal jika gagal
  } finally {
    setUploadedImageUrl(finalUrl);  // ← simpan hasilnya ke state (aman)
    setIsUploading(false);          // ← notifikasi UI: selesai
  }
};

// Dipanggil otomatis saat komponen mount — upload langsung di background
useEffect(() => { processResult(); }, []);
```

---

### Aksi #3: `QRCodeShareAction` → Generate & Tampilkan QR

Ini adalah aksi ekspor tambahan yang **tidak ada di contoh OOP** tapi merupakan subclass baru yang valid:

**File:** [ResultPage.tsx L121-L143](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L121-L143)

```typescript
// ─── "QRCodeShareAction.execute(uploadedImageUrl)" ────────────────
const handleShowQR = async () => {
  setShowQRModal(true);         // ← tampilkan modal QR

  if (!qrCodeDataUrl && uploadedImageUrl) {  // ← hindari request ulang
    try {
      const res = await fetch(`${apiBase}/api/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadedImageUrl })  // ← kirim URL cloud
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeDataUrl(data.qr_data_url);  // ← simpan QR image
      }
    } catch (err) {
      // Fallback langsung ke QR generator publik
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(uploadedImageUrl)}`;
      setQrCodeDataUrl(qrUrl);   // ← fallback tetap berjalan!
    }
  }
};
```

---

### Aksi #4: `WhatsAppShareAction` → Native Share via WA

**File:** [ResultPage.tsx L159-L169](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L159-L169)

```typescript
// ─── "NativeShareAction.execute()" — versi WhatsApp ──────────────
const handleShareWA = () => {
  const shareUrl = uploadedImageUrl.startsWith('http')
    ? uploadedImageUrl           // ← pakai URL cloud kalau sudah ada
    : 'https://ctrlsnap.app';    // ← fallback ke homepage
  
  const text = encodeURIComponent(
    `Lihat hasil photobooth AI saya dari CTRL+Snap! ✨📸\n${shareUrl}`
  );
  const cleanNumber = waNumber.replace(/\D/g, '');  // ← bersihkan nomor
  window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  // ↑ analog: navigator.share({ title, text, url })
};

// Variasi kedua: Share Status / Kontak Lain (tanpa nomor spesifik)
const handleShareWAStatus = () => {
  window.open(`https://wa.me/?text=${text}`, '_blank');
  //           ↑ tanpa nomor = buka daftar kontak WA
};
```

---

### Aksi #5: `CopyLinkAction` → Copy URL ke Clipboard

**File:** [ResultPage.tsx L172-L181](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L172-L181)

```typescript
// ─── "CopyLinkAction.execute()" ──────────────────────────────────
const handleCopyLink = async () => {
  try {
    // Buat shareable URL yang embed URL gambar cloud
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(uploadedImageUrl)}`;
    
    await navigator.clipboard.writeText(shareUrl);  // ← copy ke clipboard
    
    setCopied(true);           // ← feedback visual "Copied! Cuy 🚀"
    setTimeout(() => setCopied(false), 2000);  // ← reset setelah 2 detik
  } catch (err) {
    console.error("Failed to copy link", err);
  }
};
```

---

### Aksi #6: `GifExportAction` → Generate Live Photo GIF (Bonus!)

Subclass yang **tidak ada di contoh OOP** tapi adalah implementasi paling kompleks:

**File:** [ResultPage.tsx L183-L217](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L183-L217)

```typescript
// ─── "GifExportAction.execute(photos[])" — new subclass! ─────────
const handleGenerateGif = async () => {
  if (photos.length < 2) {
    setGifError('Minimal 2 foto diperlukan...');
    setGifState('error');
    return;  // ← guard clause (analog: if (!this.image.complete) return)
  }

  setGifState('loading');   // ← state polimorfis: idle/loading/done/error

  try {
    const res = await fetch(`${apiBase}/api/media/gif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frames: photos.map(p => p.dataUrl),  // ← kirim semua frame foto
        fps: 6,
        width: 480,
        ping_pong: true,   // ← efek Apple Live Photo!
        quality: 82,
      }),
    });

    const data = await res.json();
    setGifDataUrl(data.gif_base64);  // ← simpan hasil GIF Base64
    setGifState('done');             // ← trigger render tombol download
  } catch (err) {
    setGifState('error');
  }
};

// Tombol download GIF — identik dengan LocalDownloadAction!
<a href={gifDataUrl} download="ctrlsnap-livephoto.gif">
  <Download /> Download GIF 📥
</a>
```

---

## 3. 🏭 `PhotoExportManager` — `processResult()` sebagai Orchestrator

Konsep: *"Kelas manager yang menerima tipe apa saja asalkan turunan dari BaseExportAction"*

**File:** [ResultPage.tsx L47-L101](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L47-L101)

```typescript
// ─── "PhotoExportManager.processExport(action)" ──────────────────
const processResult = async () => {
  // STEP 1: Jalankan CloudShareAction (upload ke Cloudinary)
  const resUpload = await fetch(`${apiBase}/api/upload`, { ... });
  if (resUpload.ok) { finalUrl = uploadData.url; }
  setUploadedImageUrl(finalUrl);    // ← simpan hasil untuk aksi berikutnya

  // STEP 2: Jalankan SessionSaveAction (simpan ke database)
  await fetch(`${apiBase}/api/sessions`, {
    method: 'POST',
    body: JSON.stringify({
      device_id: getDeviceId(),
      layout_id: layout.id,
      frame_id: frame.id,
      session_mode: sessionMode,
      image_url: finalUrl,        // ← gunakan URL dari step 1
      public_id: pubId
    })
  });

  fetchHistory();  // ← refresh riwayat setelah simpan
};
```

> Manager ini mengorkestrasi **dua aksi sekaligus** — `CloudShareAction` lalu `SessionSaveAction` — tanpa komponen UI perlu tahu urutannya.

---

## 4. 📊 Diagram Semua Aksi Ekspor

```
                    ┌──────────────────────────────┐
                    │    PhotoExportManager         │
                    │  (processResult on mount)     │
                    └───────────────┬──────────────┘
                                    │
              ┌─────────────────────┼───────────────────────┐
              ▼                     ▼                       ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ CloudShareAction │  │ SessionSaveAction │  │  fetchHistory()  │
    │ POST /api/upload │  │ POST /api/sessions│  │ GET /api/sessions│
    │ → Cloudinary URL │  │ → Database row   │  │ → tampilkan grid │
    └──────────────────┘  └──────────────────┘  └──────────────────┘

User klik tombol:
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │LocalDownloadAction│  │ QRCodeShareAction│  │WhatsAppShareAction│
    │ <a href download> │  │POST /api/qrcode  │  │wa.me/?text=...   │
    │ → simpan ke HP   │  │ → modal QR scan  │  │→ buka WA native  │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
    ┌──────────────────┐  ┌──────────────────┐
    │  CopyLinkAction  │  │  GifExportAction  │
    │ clipboard.write  │  │POST /api/media/gif│
    │ → "Copied! 🚀"  │  │ → GIF ping-pong   │
    └──────────────────┘  └──────────────────┘
```

---

## 📊 Tabel Pemetaan Lengkap

| Konsep OOP (Teori) | Implementasi Nyata | File & Baris |
|---|---|---|
| `abstract class BaseExportAction` | Pola `async handle...()` yang seragam | [ResultPage.tsx L47-L217](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L47-L217) |
| `protected filename: string` | `dataUrl` prop yang dienkapsulasi | [ResultPage.tsx L7](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L7) |
| `class LocalDownloadAction` | `<a href={dataUrl} download=...>` | [ResultPage.tsx L247-L253](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L247-L253) |
| `class CloudShareAction` | `fetch('/api/upload', { body: dataUrl })` | [ResultPage.tsx L53-L69](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L53-L69) |
| `class NativeShareAction` | `handleShareWA()` + `handleShareWAStatus()` | [ResultPage.tsx L159-L169](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L159-L169) |
| `class QRCodeShareAction` *(baru!)* | `handleShowQR()` → `/api/qrcode` | [ResultPage.tsx L121-L143](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L121-L143) |
| `class CopyLinkAction` *(baru!)* | `handleCopyLink()` → `clipboard.writeText()` | [ResultPage.tsx L172-L181](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L172-L181) |
| `class GifExportAction` *(baru!)* | `handleGenerateGif()` → `/api/media/gif` | [ResultPage.tsx L183-L217](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L183-L217) |
| `class SessionSaveAction` *(baru!)* | `fetch('/api/sessions', { POST })` | [ResultPage.tsx L77-L100](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L77-L100) |
| `PhotoExportManager.processExport()` | `processResult()` orchestrator | [ResultPage.tsx L47-L101](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/ResultPage.tsx#L47-L101) |
| `action.execute(this.dataUrl)` | Tiap `handle...()` menerima `dataUrl`/`uploadedImageUrl` | semua handler |
| OCP: tambah aksi baru tanpa ubah kode lama | Cukup tambah `handle...()` baru + satu tombol | tanpa menyentuh handler lain |
