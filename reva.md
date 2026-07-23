# 🎓 Analisis OOP dalam Kodebase CTRL+Snap

Berikut adalah pemetaan langsung konsep OOP yang dijelaskan ke dalam kode nyata di proyek `ctrlsnap_photobooth`.

---

## 1. 🧬 Inheritance (Pewarisan) — via Interface Extension

Dalam TypeScript/React, **inheritance** diimplementasikan menggunakan **interface** sebagai "cetakan dasar" (analog dengan `BaseFrame`).

### `BaseFrame` → `PhotoFrame` Interface

**File:** [types.ts](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L8-L24)

```typescript
// ─── "BaseFrame" di proyek ini ────────────────────────────────
// Semua bingkai WAJIB memiliki properti dasar ini (analog abstract class)
export interface PhotoFrame {        // ← ini adalah "BaseFrame"-nya
  id: string;
  name: string;
  bgColor: string;          // ← padding / border width analog
  textColor: string;
  borderClass: string;
  accentColor: string;

  // Properti opsional (diwariskan ke varian frame spesifik):
  pattern?: string;
  headerTitle?: string;         // khusus Bubble Heart, Pop Flash, dll.
  footerBannerText?: string;    // khusus frame dengan footer banner
  footerBannerBg?: string;
  slotBgColors?: string[];      // khusus Powerbuff Snap
  slotLabels?: string[];
  imageUrl?: string;            // khusus Kawaii PNG Overlay
  isOverlayPng?: boolean;
}
```

### Subclass Konkret — Instance `FRAMES[]`

**File:** [types.ts](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L84-L169)

Setiap objek di dalam `FRAMES[]` adalah "subclass konkret" dari `PhotoFrame`:

```typescript
// ─── "PolaroidFrame extends BaseFrame" ───
{
  id: 'bubble-heart',
  name: 'Bubble Heart 🩷',
  bgColor: '#FF85A1',           // properti BaseFrame (wajib)
  textColor: '#FFFFFF',
  borderClass: 'border-[#FF85A1]',
  accentColor: '#FFB3C6',
  description: 'Pink kawaii photostrip',
  // ↓ Properti TAMBAHAN spesifik frame ini (seperti override/extend)
  headerTitle: 'BUBBLE HEART',
  slotBgColors: ['#FFA3B8', ...],
  slotLabels: ['♡ LOVE ♡', ...],
  footerBannerText: 'SPARKLING LOVE MODE',
  footerBannerBg: '#FFD1DC'
},

// ─── "OverlayFrame extends BaseFrame" ───
{
  id: 'kawaii-overlay',
  name: 'Kawaii PNG Overlay 🎀',
  bgColor: '#FFFFFF',           // properti BaseFrame (wajib)
  textColor: '#FF5B94',
  borderClass: 'border-[#FF5B94]',
  accentColor: '#FF5B94',
  // ↓ Properti eksklusif hanya untuk frame jenis PNG overlay
  imageUrl: '/images/overlay_kawaii_pink.png',
  isOverlayPng: true
}
```

> **Analogi:** `PhotoFrame` = `abstract class BaseFrame`, sedangkan setiap entry di `FRAMES[]` = `class BubbleHeartFrame extends BaseFrame` / `class KawaiiOverlayFrame extends BaseFrame`.

---

## 2. 🔒 Encapsulation (Enkapsulasi) — via React State

Properti frame **tersembunyi di dalam state React** dan tidak bisa diubah sembarangan dari luar — hanya lewat fungsi setter yang sudah ditentukan.

### State yang Dienkapsulasi di `PhotoEditor`

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L39-L42)

```typescript
// ─── Properti "private" yang dienkapsulasi dalam state ──────────
const [selectedFrame, setSelectedFrame] = useState<PhotoFrame>(initialFrame);
//     ↑ "private frame: PhotoFrame"      ↑ "public setFrame()" — satu-satunya cara ubah

const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>(FILTERS[0]);
const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
const [texts, setTexts]                   = useState<TextItem[]>([]);
```

### Setter Terkontrol (Getter/Setter Pattern)

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L22-L36)

```typescript
// ─── Setter "public" yang mengontrol perubahan properti ─────────
const handleCustomColorChange = (color: string) => {
  setSelectedFrame(prev => ({
    ...prev,
    id: 'custom-frame',
    name: 'Custom Frame',
    bgColor: color          // ← hanya bgColor yang boleh diubah via fungsi ini
  }));
};

const handleCustomTextColorChange = (textColor: string) => {
  setSelectedFrame(prev => ({
    ...prev,
    textColor: textColor   // ← hanya textColor yang boleh diubah via fungsi ini
  }));
};
```

> **Analogi:** `selectedFrame` = `private frame`, `setSelectedFrame` / `handleCustomColorChange` = `public setPadding()` / `public setColor()`. Tidak ada komponen luar yang bisa mengubah frame secara langsung tanpa melewati fungsi ini.

---

## 3. 🎭 Polymorphism (Polimorfisme) — via `render()` Pattern

**Konsep:** Mesin utama (`compilePhotostrip`) tidak peduli frame apa yang aktif — ia cukup "memanggil" satu blok logika yang berjalan berbeda tergantung tipe frame.

### Engine Render — `compilePhotostrip`

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L166-L499)

```typescript
// ─── Engine "PhotoboothEngine.applyFrame()" di proyek ini ───────
const compilePhotostrip = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // ENGINE hanya memanggil satu alur render,
  // tapi hasil visual BERBEDA tergantung frame yang aktif:

  // 🎭 POLIMORFISME #1 — Render background (berbeda per frame)
  if (selectedFrame.id === 'powerbuff-snap') {
    ctx.fillStyle = '#FFF3D0';    // Powerbuff: background cream-orange
    // ... gambar header pink dengan circle dan title khusus
  } else if (selectedFrame.headerTitle) {
    ctx.fillStyle = selectedFrame.bgColor;
    ctx.fillText(selectedFrame.headerTitle, ...); // Frame biasa dengan header teks
  }
  // ↑ sama seperti: frame.render(ctx, w, h) → berbeda per subclass

  // 🎭 POLIMORFISME #2 — Render foto slot (berbeda per frame)
  if (selectedFrame.slotBgColors && !customFrameBgImage) {
    // Frame dengan slot berwarna (Powerbuff, Bubble Heart, dll.)
    const slotBg = selectedFrame.slotBgColors[i % slotBgColors.length];
    ctx.fillStyle = slotBg;
    ctx.roundRect(cardX, cardY, slotW, slotH, 16);
  }

  // 🎭 POLIMORFISME #3 — Render PNG Overlay (hanya KawaiiOverlay frame)
  if (selectedFrame.imageUrl || customFrameBgImage) {
    const frameOverlayImg = await loadImage(selectedFrame.imageUrl!);
    ctx.drawImage(frameOverlayImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Frame PNG overlay — gambar langsung di atas semua layer
  }

  // 🎭 POLIMORFISME #4 — Render footer banner (berbeda per frame)
  if (selectedFrame.id === 'powerbuff-snap') {
    // Footer khusus Powerbuff: banner mint tebal 90px + teks bold
    ctx.fillStyle = selectedFrame.footerBannerBg || '#C0FAF0';
    ctx.fillRect(0, CANVAS_HEIGHT - 90, CANVAS_WIDTH, 90);
  } else if (selectedFrame.footerBannerText) {
    // Footer banner standar: tinggi 60px
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
    ctx.fillText(selectedFrame.footerBannerText, ...);
  } else {
    // Frame minimalis: hanya watermark "CTRL+Snap" kecil
    ctx.fillText('CTRL+Snap', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 24);
  }
};
```

### Polimorfisme di DOM Live Preview

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L541-L673)

```tsx
{/* 🎭 DOM Preview juga bersifat polimorfis — render berbeda per frame */}

{/* Powerbuff Snap: header dengan dot merah & hijau */}
{selectedFrame.id === 'powerbuff-snap' && !customFrameBgImage && (
  <div className="bg-[#FFD8E6]...">
    <span className="bg-[#FF3B7B] rounded-full" />
    <span className="bg-[#00D494] rounded-full" />
    <div>POWERBUFF SNAP</div>
  </div>
)}

{/* Frame standar dengan headerTitle: render teks judul saja */}
{selectedFrame.headerTitle && selectedFrame.id !== 'powerbuff-snap' && (
  <div className="text-center py-2...">
    {selectedFrame.headerTitle}
  </div>
)}

{/* Kawaii PNG Overlay: render gambar transparan di atas semua */}
{(customFrameBgImage || selectedFrame.imageUrl) && (
  <img src={selectedFrame.imageUrl} className="absolute inset-0 z-30..." />
)}
```

---

## 📊 Peta OOP → Kode Aktual

| Konsep OOP | Analogi Konseptual | Implementasi Nyata di Proyek |
|---|---|---|
| **`abstract class BaseFrame`** | Cetakan utama frame | [`interface PhotoFrame`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L8-L24) |
| **`class PolaroidFrame extends BaseFrame`** | Subclass spesifik | Objek `bubble-heart` / `kawaii-overlay` di [`FRAMES[]`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L84-L169) |
| **`this.padding` (private)** | Properti tersembunyi | `useState<PhotoFrame>` di [`PhotoEditor.tsx:40`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L39-L42) |
| **`getPadding()` (public setter)** | Metode terkontrol | `handleCustomColorChange()` di [`PhotoEditor.tsx:22-36`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L22-L36) |
| **`frame.render(ctx, w, h)`** | Metode polimorfis | `compilePhotostrip()` di [`PhotoEditor.tsx:166-499`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L166-L499) |
| **`PhotoboothEngine.applyFrame(frame)`** | Engine yang agnostik | Semua blok `if (selectedFrame.id === ...)` di dalam compiler |

---

## 💡 Cara Menambahkan Frame Baru (OCP — Open/Closed Principle)

Seperti yang dijelaskan, menambahkan `ChristmasFrame` **tidak perlu mengubah engine**. Cukup:

**File:** [types.ts](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L84)

```typescript
// Tambahkan satu entry baru di FRAMES[] — engine otomatis mendukungnya
export const FRAMES: PhotoFrame[] = [
  // ... frame yang sudah ada ...
  
  // ✨ BARU: ChristmasFrame — cukup tambahkan ini!
  {
    id: 'christmas-joy',
    name: 'Christmas Joy 🎄',
    bgColor: '#1B4332',
    textColor: '#FFD700',
    borderClass: 'border-[#1B4332]',
    accentColor: '#FF4444',
    description: 'Hangat, meriah, dan penuh semangat Natal',
    headerTitle: '🎄 CHRISTMAS JOY 🎄',
    slotBgColors: ['#2D6A4F', '#1B4332', '#2D6A4F', '#1B4332'],
    slotLabels: ['❄ MERRY ❄', '🎅 JOLLY 🎅', '⭐ BRIGHT ⭐', '🔔 BELLS 🔔'],
    footerBannerText: 'SEASON\'S GREETINGS • CTRL+Snap',
    footerBannerBg: '#FF4444'
  }
];
```

> `compilePhotostrip()` dan `FramePreview` langsung mendukung frame baru ini **tanpa perubahan kode engine apapun** — inilah kekuatan OCP dan Polymorphism! 🎯
