# 🎓 OOP Sesi 4 — Tiga Pilar Arsitektur CTRL+Snap

Memetakan **Abstraksi → Enkapsulasi → Polimorfisme** ke kode yang benar-benar berjalan di proyek.

---

## 1. 🔮 Abstraction (Abstraksi) — Interface sebagai Cetak Biru

Konsep: *"Menyembunyikan kompleksitas implementasi, hanya mengekspos atribut esensial"*

### `PhotoFilter` — Abstraksi Filter Foto

**File:** [types.ts L1-L6](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L1-L6)

```typescript
// ─── Cetak biru abstrak untuk Filter ─────────────────────────────
export interface PhotoFilter {
  id: string;          // ← identitas unik
  name: string;        // ← nama yang ditampilkan ke user
  className: string;   // ← detail CSS TERSEMBUNYI di balik satu properti ini
  description: string; // ← deskripsi singkat
}
```

> Pengguna interface ini **tidak perlu tahu** bahwa `className` berisi kombinasi panjang seperti `'sepia-[0.25] saturate-[1.2] contrast-[1.1] hue-rotate-[10deg] brightness-[0.98]'` — mereka cukup memanggil `filter.className`.

### `PhotostripLayout` — Abstraksi Grid Layout

**File:** [types.ts L51-L59](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L51-L59)

```typescript
// ─── Cetak biru abstrak untuk Grid Layout ────────────────────────
export interface PhotostripLayout {
  id: 'strip-4' | 'grid-4' | 'classic-3' | 'single-1';
  name: string;
  cols: number;        // ← kolom grid (1 atau 2)
  rows: number;        // ← baris grid (1, 2, 3, atau 4)
  aspectRatio: string; // ← rasio aspek CSS abstrak
  description: string;
}
```

> Komponen yang menggunakan `PhotostripLayout` **tidak perlu tahu** bahwa `grid-4` berarti 2×2, `strip-4` berarti 1×4, dll. Cukup baca `.cols` dan `.rows` — kompleksitasnya tersembunyi di dalam objek.

---

## 2. 🔒 Encapsulation (Enkapsulasi) — Data Terbungkus Aman

### Layer 1: Data Konstan — Array `FILTERS[]` & `LAYOUTS[]`

Konsep: *"Konfigurasi dibungkus di dalam objek data konstan"*

**File:** [types.ts L157-L166](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L157-L166)

```typescript
// ─── ENKAPSULASI data filter: detail CSS terkunci di dalam array ──
export const FILTERS: PhotoFilter[] = [
  { id: 'normal',     name: 'Normal Feed',       className: '',
    description: 'Warna asli tanpa filter' },

  // Detail CSS panjang TERSEMBUNYI di dalam objek — pengguna hanya lihat nama:
  { id: 'kodak',      name: 'Kodak Gold 1995',
    className: 'sepia-[0.25] saturate-[1.2] contrast-[1.1] hue-rotate-[10deg] brightness-[0.98]',
    description: 'Golden hour setiap saat' },

  { id: 'cyberpunk',  name: 'Cyberpunk Duotone',
    className: 'hue-rotate-[180deg] saturate-150 contrast-125',
    description: 'Vibe neon kota masa depan' },

  { id: 'monochrome', name: 'Monochrome Noir',
    className: 'grayscale contrast-[1.3] brightness-[0.95]',
    description: 'Klasik hitam putih dramatis' },
  // ...
];
```

**File:** [types.ts L63-L70](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L63-L70)

```typescript
// ─── ENKAPSULASI data layout: rows & cols terkunci di dalam array ─
export const LAYOUTS: PhotostripLayout[] = [
  { id: 'single-1',  name: '1x1 Solo Portrait', cols: 1, rows: 1,
    aspectRatio: 'aspect-square',              description: 'Fokus pada satu momen epik' },
  { id: 'classic-3', name: '1x3 Classic Strip', cols: 1, rows: 3,
    aspectRatio: 'aspect-photostrip-vertical', description: 'Gaya photobooth retro' },
  { id: 'strip-4',   name: '1x4 Iconic Strip',  cols: 1, rows: 4,
    aspectRatio: 'aspect-photostrip-vertical', description: 'Format strip paling populer' },
  { id: 'grid-4',    name: '2x2 Bento Grid',    cols: 2, rows: 2,
    aspectRatio: 'aspect-square',              description: 'Kolase estetik kekinian' },
];
```

---

### Layer 2: React State — Kapsul UI yang Terisolasi

Konsep: *"React state mencegah manipulasi langsung dari luar komponen"*

**File:** [Photobooth.tsx L18](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L18)

```typescript
// ─── ENKAPSULASI: state filter terisolasi di dalam komponen ──────
const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>(FILTERS[0]);
//                      ↑ setter adalah satu-satunya pintu masuk resmi
//     ↑ data filter tidak bisa disentuh dari komponen manapun di luar ini
```

**Penerapan enkapsulasi — komponen cukup panggil `.className` tanpa tahu isinya:**

**File:** [Photobooth.tsx L277](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L272-L279)

```tsx
{/* ─── ENKAPSULASI: pakai filter.className tanpa tahu kombinasi CSS-nya ── */}
<video
  ref={videoRef}
  autoPlay playsInline muted
  className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`}
  //                                                               ↑ cukup satu properti ini
  //   tidak perlu tahu bahwa Kodak = 'sepia-[0.25] saturate-[1.2] contrast-[1.1] ...'
/>
```

**Enkapsulasi yang sama di tiga tempat berbeda — konsistensi sempurna:**

**File:** [Photobooth.tsx L377](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L377) — thumbnail grid foto:
```tsx
<img className={`w-full h-full object-cover ${selectedFilter.className}`} />
//                                             ↑ pola identik, beda komponen
```

**File:** [TemplateSelector.tsx L260](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/TemplateSelector.tsx#L260) — live preview video:
```tsx
<video className={`... transform -scale-x-100`} />
//  tidak perlu passing filter — enkapsulasi menjaga state tetap lokal
```

**File:** [PhotoEditor.tsx L594](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L594) — editor preview:
```tsx
<img className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} />
//                                                                    ↑ pola abstraksi diulang
```

---

## 3. 🎭 Polymorphism (Polimorfisme) — Satu Loop, Semua Layout

Konsep: *"Satu blok kode looping tunggal yang merender grid secara dinamis"*

### Polimorfisme di `TemplateSelector.tsx` — Live Preview Dinamis

**File:** [TemplateSelector.tsx L253-L266](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/TemplateSelector.tsx#L253-L266)

```tsx
{/* ─── SATU LOOP untuk SEMUA VARIAN layout ────────────────────────
    Grid 2x2, Strip 1x4, Classic 1x3, Solo 1x1 — semuanya dari loop ini */}
<div className={`relative z-10 w-full flex
  ${selectedLayout.id === 'grid-4' ? 'flex-wrap gap-2' : 'flex-col gap-2'}`}>

  {Array(selectedLayout.rows * selectedLayout.cols)  // ← rows×cols = jumlah kotak
    .fill(0)
    .map((_, i) => (
      <div
        key={i}
        className={`relative flex items-center justify-center overflow-hidden rounded-xl
          ${selectedLayout.id === 'grid-4'
            ? 'w-[calc(50%-4px)] aspect-square'  // ← 2 kolom untuk grid-4
            : 'w-full aspect-[4/3]'              // ← 1 kolom untuk semua lainnya
          } border border-ink/10`}
      >
        {i === 0 ? (
          <video ref={videoRef} autoPlay playsInline muted /* ← slot pertama: kamera live */ />
        ) : (
          <Camera className="w-6 h-6 opacity-20" />  // ← slot lain: placeholder
        )}
      </div>
    ))}
</div>

{/* Hasil kalkulasi rows×cols:
    single-1  → 1×1 = 1 kotak
    classic-3 → 3×1 = 3 kotak
    strip-4   → 4×1 = 4 kotak
    grid-4    → 2×2 = 4 kotak (tapi 2 kolom!) */}
```

### Polimorfisme di `Photobooth.tsx` — Thumbnail Grid Progress

**File:** [Photobooth.tsx L373-L384](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L373-L384)

```tsx
{/* ─── SATU LOOP thumbnail untuk SEMUA layout ─────────────────────
    Layout berbeda → CSS grid berbeda → tampilan berbeda otomatis  */}
<div className={`grid gap-2
  ${layout.id === 'grid-4'   ? 'grid-cols-2'  // ← 2 kolom untuk Bento Grid
  : layout.id === 'single-1' ? 'grid-cols-1'  // ← 1 kolom untuk Solo
  :                            'grid-cols-2'}` // ← 2 kolom untuk strip (preview kecil)
}>
  {Array(totalPhotos).fill(0).map((_, i) => (
    <div key={i} className="relative flex aspect-[4/3] ...">
      {photos[i] ? (
        <img src={photos[i].dataUrl}               // ← slot terisi: foto nyata
          className={`w-full h-full object-cover ${selectedFilter.className}`} />
      ) : (
        <span className="font-display text-2xl">{i + 1}</span>  // ← slot kosong: nomor
      )}
    </div>
  ))}
</div>
```

### Polimorfisme di `PhotoEditor.tsx` — Compiler Canvas Adaptif

**File:** [PhotoEditor.tsx L186-L200](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L186-L200)

```typescript
// ─── Satu switch — tinggi kanvas berbeda per layout ───────────────
const CANVAS_WIDTH = 600;
let CANVAS_HEIGHT = 600;  // default

switch(layout.id) {
  case 'single-1':  CANVAS_HEIGHT = 680;   break; // ← 1 foto: kanvas pendek
  case 'classic-3': CANVAS_HEIGHT = 1600;  break; // ← 3 foto: kanvas sedang
  case 'strip-4':   CANVAS_HEIGHT = 2100;  break; // ← 4 foto: kanvas panjang
  case 'grid-4':
    CANVAS_HEIGHT = (selectedFrame.headerTitle) ? 1040 : 720; break; // ← 4 foto grid
}
// ← satu komponen, satu canvas — tapi output BERBEDA per layout
```

---

## 📊 Diagram Tiga Pilar Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    ABSTRACTION LAYER                        │
│  ┌─────────────────────┐   ┌──────────────────────────┐    │
│  │  interface           │   │  interface               │    │
│  │  PhotoFilter         │   │  PhotostripLayout        │    │
│  │  { id, name,        │   │  { id, name,             │    │
│  │    className,       │   │    cols, rows,           │    │
│  │    description }    │   │    aspectRatio }         │    │
│  └─────────────────────┘   └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓ mengisi
┌─────────────────────────────────────────────────────────────┐
│                   ENCAPSULATION LAYER                       │
│  ┌─────────────────────┐   ┌──────────────────────────┐    │
│  │  const FILTERS[]    │   │  const LAYOUTS[]         │    │
│  │  "Kodak Gold"       │   │  "Bento Grid" cols:2     │    │
│  │  className: 'sepia  │   │               rows:2     │    │
│  │  saturate contrast  │   │  "Solo" cols:1 rows:1    │    │
│  │  hue-rotate...'     │   │  ...                     │    │
│  └─────────────────────┘   └──────────────────────────┘    │
│                                                             │
│  useState<PhotoFilter>        useState<PhotostripLayout>   │
│  (terisolasi dalam komponen)  (terisolasi dalam komponen)  │
└─────────────────────────────────────────────────────────────┘
                          ↓ dikonsumsi oleh
┌─────────────────────────────────────────────────────────────┐
│                   POLYMORPHISM LAYER                        │
│                                                             │
│  Array(layout.rows * layout.cols).fill(0).map(...)         │
│       ↑                                                     │
│  SATU LOOP → output 1 kotak, 3 kotak, 4 kotak,            │
│              atau 4 kotak 2-kolom — semuanya adaptif       │
│                                                             │
│  video className={`... ${selectedFilter.className}`}       │
│                        ↑                                   │
│  SATU PROP → output normal, kodak, cyberpunk,              │
│              monochrome, dll — tanpa if-else di komponen   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Tabel Pemetaan Lengkap

| Pilar OOP | Konsep (Teori) | Implementasi Nyata | File & Baris |
|---|---|---|---|
| **Abstraksi** | Cetak biru interface | `interface PhotoFilter` | [types.ts:1-6](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L1-L6) |
| **Abstraksi** | Cetak biru interface | `interface PhotostripLayout` | [types.ts:51-59](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L51-L59) |
| **Enkapsulasi** | Data konstan terbungkus | `const FILTERS[]` | [types.ts:157-166](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L157-L166) |
| **Enkapsulasi** | Data konstan terbungkus | `const LAYOUTS[]` | [types.ts:63-70](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L63-L70) |
| **Enkapsulasi** | Kapsul state UI | `useState<PhotoFilter>` | [Photobooth.tsx:18](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L18) |
| **Enkapsulasi** | Pakai tanpa tahu detail CSS | `${selectedFilter.className}` | [Photobooth.tsx:277](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L277) |
| **Polimorfisme** | Satu loop, semua layout | `Array(rows×cols).map(...)` | [TemplateSelector.tsx:254](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/TemplateSelector.tsx#L253-L266) |
| **Polimorfisme** | Grid adaptif per layout | thumbnail `grid-cols-2/1` | [Photobooth.tsx:373](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L373-L384) |
| **Polimorfisme** | Canvas tinggi adaptif | `switch(layout.id)` | [PhotoEditor.tsx:187](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L186-L200) |
