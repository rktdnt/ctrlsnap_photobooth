# 🎓 OOP Sesi 2 — Canvas Objects di CTRL+Snap

Memetakan `BaseCanvasObject` → `StickerObject` → `TextObject` → `CanvasEditorManager` ke kode yang **benar-benar berjalan** di proyek.

---

## 1. 🔒 Encapsulation — Setiap Elemen adalah Objek Mandiri

Konsep: *"Setiap elemen diisolasi menjadi objek tersendiri yang mengingat datanya masing-masing"*

### `PlacedSticker` — analog `StickerObject` yang terenkapsulasi

**File:** [types.ts](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L42-L49)

```typescript
// ─── "class StickerObject" di proyek ini ─────────────────────────
export interface PlacedSticker {
  id: string;       // identitas unik tiap stiker
  emoji: string;    // ← konten (analog: private image: HTMLImageElement)

  // Properti transformasi — semuanya tersimpan di dalam objeknya:
  x: number;        // ← koordinat X (dalam %)
  y: number;        // ← koordinat Y (dalam %)
  scale: number;    // ← ukuran (analog: this.scale)
  rotation: number; // ← rotasi (analog: this.rotation)
}
```

### `TextItem` — analog `TextObject` yang terenkapsulasi

**File:** [types.ts](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L32-L40)

```typescript
// ─── "class TextObject" di proyek ini ────────────────────────────
export interface TextItem {
  id: string;           // identitas unik tiap teks
  text: string;         // ← konten (analog: private text: string)
  color: string;        // ← warna (analog: private color: string)
  fontFamily: string;   // ← font (analog: private font: string)
  fontSize: number;     // ← ukuran font

  // Properti posisi — tersimpan di dalam objeknya:
  x: number;            // ← koordinat X (dalam %)
  y: number;            // ← koordinat Y (dalam %)
}
```

> **Analogi:** `PlacedSticker` = `class StickerObject`, `TextItem` = `class TextObject`. Keduanya mengingat sendiri semua data yang diperlukan untuk dirender.

---

## 2. 🧬 Inheritance — Interface Bersama sebagai "BaseCanvasObject"

Kedua interface (`PlacedSticker` dan `TextItem`) memiliki **struktur bersama** yang identik dengan `BaseCanvasObject`:

| `BaseCanvasObject` (konsep) | `PlacedSticker` | `TextItem` |
|---|---|---|
| `protected x: number` | `x: number` | `x: number` |
| `protected y: number` | `y: number` | `y: number` |
| `protected scale: number` | `scale: number` | *(via fontSize)* |
| `protected rotation: number` | `rotation: number` | *(fixed 0)* |
| `protected content` | `emoji: string` | `text: string` |

Dalam TypeScript modern dengan React, **union type** menggantikan abstract class:

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L51)

```typescript
// ─── Analog "BaseCanvasObject" via union type ─────────────────────
// Array polimorfis yang bisa menampung stiker MAUPUN teks sekaligus
const [draggingItem, setDraggingItem] = useState<{
  id: string,
  type: 'sticker' | 'text'   // ← discriminated union = polimorfisme tipe
} | null>(null);
```

---

## 3. 🎭 Polymorphism — Metode `.draw()` yang Berbeda per Tipe

Ini adalah inti polimorfisme: **satu loop yang sama**, tapi cara render berbeda untuk stiker vs teks.

### Loop Render — analog `CanvasEditorManager.redrawAll()`

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L389-L427)

```typescript
// ─── "CanvasEditorManager.redrawAll()" di proyek ini ─────────────
// compilePhotostrip() memanggil dua loop secara berurutan:

// 🎭 Loop 1: StickerObject.draw() → gambar emoji ke canvas
// (Setiap stiker "tahu" cara menggambar dirinya sendiri)
placedStickers.forEach(sticker => {    // ← for (const obj of this.objects) { obj.draw(ctx) }
  ctx.save();
  const px = (sticker.x / 100) * CANVAS_WIDTH;
  const py = (sticker.y / 100) * CANVAS_HEIGHT;
  
  ctx.translate(px, py);                          // ← ctx.translate(this.x, this.y)
  ctx.rotate((sticker.rotation * Math.PI) / 180); // ← ctx.rotate(this.rotation)
  
  const fontSize = 48 * sticker.scale;            // ← ctx.scale(this.scale, this.scale)
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sticker.emoji, 0, 0);              // ← cara gambar STIKER (berbeda dengan teks!)
  ctx.restore();
});

// 🎭 Loop 2: TextObject.draw() → tulis teks typography ke canvas
// (Cara render BERBEDA dari stiker, tapi dipanggil dengan pola yang sama)
texts.forEach(t => {                              // ← for (const obj of this.objects) { obj.draw(ctx) }
  ctx.save();
  const px = (t.x / 100) * CANVAS_WIDTH;
  const py = (t.y / 100) * CANVAS_HEIGHT;
  
  ctx.font = `bold ${t.fontSize * 1.5}px ${t.fontFamily}, sans-serif`; // ← cara render TEKS
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.color;                        // ← properti eksklusif TextObject
  
  // Shadow hanya untuk teks (tidak ada di StickerObject!)
  if (selectedFrame.bgColor.toUpperCase() === '#FFFFFF') {
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
  }
  
  ctx.fillText(t.text, px, py);                  // ← cara gambar TEKS (berbeda dari stiker!)
  ctx.restore();
});
```

---

## 4. 🕹️ Metode `.move()` — Drag & Drop Handler

Konsep: *"`public move(newX, newY)` untuk fitur Drag & Drop"*

### `handlePointerMove` — analog `BaseCanvasObject.move()`

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L105-L136)

```typescript
// ─── "public move(newX, newY)" di proyek ini ─────────────────────
useEffect(() => {
  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingItem || !containerRef.current) return;
    
    // Hitung koordinat baru dari posisi pointer
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    // 🎭 POLIMORFISME: move() dipanggil untuk dua tipe berbeda
    if (draggingItem.type === 'sticker') {
      // StickerObject.move(newX, newY) → update posisi stiker
      setPlacedStickers(prev => prev.map(s =>
        s.id === draggingItem.id
          ? { ...s, x: clampedX, y: clampedY }  // ← this.x = newX; this.y = newY
          : s
      ));
    } else if (draggingItem.type === 'text') {
      // TextObject.move(newX, newY) → update posisi teks
      setTexts(prev => prev.map(t =>
        t.id === draggingItem.id
          ? { ...t, x: clampedX, y: clampedY }  // ← this.x = newX; this.y = newY
          : t
      ));
    }
  };
  // ...
}, [draggingItem]);
```

### `handlePointerDown` — analog "hit detection" untuk memilih objek

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L100-L103)

```typescript
// ─── "Cari objek mana yang di-click" ─────────────────────────────
const handlePointerDown = (e: React.PointerEvent, id: string, type: 'sticker' | 'text') => {
  e.preventDefault();
  setDraggingItem({ id, type }); // ← simpan referensi ke objek yang sedang digeser
};
```

---

## 5. 📦 Metode `.setScale()` & `.setRotation()` — Slider Controls

Konsep: *"`public setScale(scale)` dan `public setRotation(angle)`"*

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L739-L762)

```tsx
{/* ─── "StickerObject.setScale()" di proyek ini ─── */}
<input
  type="range" min="0.5" max="3" step="0.1"
  value={s.scale}
  onChange={(e) => {
    const newS = [...placedStickers];
    newS[idx].scale = Number(e.target.value); // ← this.scale = scale
    setPlacedStickers(newS);
  }}
/>

{/* ─── "StickerObject.setRotation()" di proyek ini ─── */}
<input
  type="range" min="-180" max="180"
  value={s.rotation}
  onChange={(e) => {
    const newS = [...placedStickers];
    newS[idx].rotation = Number(e.target.value); // ← this.rotation = angle
    setPlacedStickers(newS);
  }}
/>
```

---

## 6. 🏭 `CanvasEditorManager.addElement()` — Handler Tambah Objek

**File:** [PhotoEditor.tsx](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L140-L163)

```typescript
// ─── "editor.addElement(new StickerObject(...))" ─────────────────
const handleAddSticker = (sticker: Sticker) => {
  setPlacedStickers(prev => [...prev, {   // ← this.objects.push(element)
    id: Math.random().toString(36).substring(7),
    emoji: sticker.emoji,
    x: 50,                                // ← posisi default center
    y: 20 + (prev.length * 5),           // ← cascade agar tidak menumpuk
    scale: 1,                             // ← this.scale = 1 (default)
    rotation: 0                           // ← this.rotation = 0 (default)
  }]);
};

// ─── "editor.addElement(new TextObject(...))" ────────────────────
const handleAddText = () => {
  if (!inputText.trim()) return;
  setTexts(prev => [...prev, {            // ← this.objects.push(element)
    id: Math.random().toString(36).substring(7),
    text: inputText,                      // ← this.text = text
    color: '#FFFFFF',                     // ← this.color = '#FFFFFF' (default)
    fontFamily: 'Outfit',                 // ← this.font = 'bold 32px Inter' (default)
    fontSize: 24,
    x: 50,
    y: 90
  }]);
  setInputText('');
};
```

---

## 📊 Tabel Pemetaan Lengkap

| Konsep OOP (Teori) | Implementasi Nyata | File & Baris |
|---|---|---|
| `abstract class BaseCanvasObject` | Properti bersama `x, y` di kedua interface | [types.ts:32-49](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L32-L49) |
| `class StickerObject extends Base` | `interface PlacedSticker` | [types.ts:42-49](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L42-L49) |
| `class TextObject extends Base` | `interface TextItem` | [types.ts:32-40](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L32-L40) |
| `this.image` (private) | `emoji: string` di PlacedSticker | [types.ts:44](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L44) |
| `this.text / this.color / this.font` (private) | `text, color, fontFamily` di TextItem | [types.ts:34-37](file:///c:/Code/ctrlsnap_photobooth/frontend/src/types.ts#L34-L37) |
| `public move(x, y)` | `handlePointerMove` → update `x, y` | [PhotoEditor.tsx:106-120](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L106-L120) |
| `public setScale(scale)` | Slider `onChange` → `newS[idx].scale` | [PhotoEditor.tsx:750-752](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L739-L762) |
| `public setRotation(angle)` | Slider `onChange` → `newS[idx].rotation` | [PhotoEditor.tsx:756-758](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L739-L762) |
| `StickerObject.draw(ctx)` | Loop `placedStickers.forEach` di compiler | [PhotoEditor.tsx:390-405](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L389-L405) |
| `TextObject.draw(ctx)` | Loop `texts.forEach` di compiler | [PhotoEditor.tsx:408-427](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L407-L427) |
| `CanvasEditorManager.objects[]` | `placedStickers[]` dan `texts[]` state | [PhotoEditor.tsx:41-42](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L41-L42) |
| `manager.addElement(element)` | `handleAddSticker()` / `handleAddText()` | [PhotoEditor.tsx:140-163](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L140-L163) |
| `manager.redrawAll()` | `compilePhotostrip()` — render semua layer | [PhotoEditor.tsx:166](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/PhotoEditor.tsx#L166) |

---

## 🔑 Perbedaan Kunci: OOP Class vs React Pattern

| Aspek | OOP Class (Teori) | React State (Implementasi) |
|---|---|---|
| Penyimpanan data | `private` property dalam instance | `useState<PlacedSticker[]>` |
| Trigger re-render | Manual `redrawAll()` | Otomatis oleh React state update |
| Tambah objek | `new StickerObject(...)` | Object literal `{ emoji, x, y, ... }` |
| Update posisi | `obj.move(x, y)` | Immutable: `prev.map(s => s.id === id ? {...s, x, y} : s)` |
| "Draw loop" | `for (const obj of objects) obj.draw(ctx)` | `placedStickers.forEach(s => {...})` di compiler |

> **Kesimpulan:** React tidak menggunakan class instance, tapi **prinsip OOP tetap dipertahankan** — setiap elemen menyimpan data lengkapnya sendiri (enkapsulasi), rendering berbeda per tipe (polimorfisme), dan struktur data berbagi properti bersama (inheritance via interface).
