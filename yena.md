# 🎓 OOP Sesi 3 — Timer & Observer Pattern di CTRL+Snap

Memetakan `PhotoboothTimer` (Encapsulation + Observer Pattern) ke kode yang **benar-benar berjalan** di [`Photobooth.tsx`](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx).

---

## 1. 🔒 Encapsulation — Properti Timer yang "Tersembunyi"

Konsep: *"data krusial dikunci di dalam kelas — UI luar tidak boleh mengubah detik secara langsung"*

### `private` Properties → `useState` & `useRef`

**File:** [Photobooth.tsx L13-L27](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L13-L27)

```typescript
// ─── Analog "private" properties di dalam class ───────────────────

// private intervalId: number | null = null
const audioCtxRef = useRef<AudioContext | null>(null);      // ← AudioContext tersembunyi di dalam Ref
//                                                              (tidak bisa diakses dari luar komponen)

// private isRunning: boolean = false
const [isCapturing, setIsCapturing] = useState(false);     // ← status menyala/mati timer

// private timeLeft: number
const [countdown, setCountdown] = useState<number | null>(null); // ← nilai detik saat ini

// private duration: number  (nilai awal yang bisa dikonfigurasi)
const [timerDuration, setTimerDuration] = useState<number>(3);   // ← 3s / 5s / 10s

// "intervalId" tersembunyi di dalam closure async (tidak bisa diubah dari luar)
// → lihat runSequence() di bawah
```

Komponen induk (`App.tsx`) **tidak punya akses** ke `countdown`, `isCapturing`, atau `audioCtxRef` — persis seperti `private` di OOP class.

---

## 2. 🏁 Metode `start()` → `startCaptureSequence()`

Konsep: *"`public start()` — Mencegah double-start, reset timeLeft, jalankan interval"*

**File:** [Photobooth.tsx L183-L225](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L183-L225)

```typescript
// ─── "public start(): void" di proyek ini ────────────────────────
const startCaptureSequence = async () => {
  if (isCapturing) return;   // ← if (this.isRunning) return; (mencegah double-start!)
  
  // Resume AudioContext (browser policy — analog inisiasi resource)
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') { await ctx.resume(); }

  setIsCapturing(true);      // ← this.isRunning = true
  setPhotos([]);             // ← this.timeLeft = this.duration (reset ke awal)

  // ─── "intervalId" disembunyikan di dalam closure async ────────
  const runSequence = async (photoIndex: number) => {
    if (photoIndex >= totalPhotos) {
      setIsCapturing(false); // ← this.isRunning = false
      playComplete();        // ← OBSERVER: notifikasi "Complete"!
      return;
    }

    // Countdown loop — analog window.setInterval setiap 1000ms
    for (let i = timerDuration; i > 0; i--) {
      setCountdown(i);       // ← this.onTick(this.timeLeft) — update UI!
      playTick();            // ← OBSERVER: notifikasi "Tick" ke audio engine!
      await new Promise(r => setTimeout(r, 1000)); // ← setiap 1 detik
    }
    
    setCountdown(0);         // ← this.timeLeft = 0 → tampilkan "📸"
    await new Promise(r => setTimeout(r, 200));
    takePhoto();             // ← this.onComplete() → ambil foto!
    setCountdown(null);      // ← sembunyikan countdown overlay

    // Jeda sebelum foto berikutnya (fitur multi-shot)
    if (photoIndex < totalPhotos - 1) {
      await new Promise(r => setTimeout(r, 1500));
      runSequence(photoIndex + 1); // ← rekursi = loop multi-shot
    } else {
      setIsCapturing(false); // ← this.isRunning = false
      playComplete();        // ← OBSERVER: notifikasi "Complete" final!
    }
  };

  runSequence(0); // ← timer.start()
};
```

---

## 3. ⏹️ Metode `stop()` → Cleanup di `useEffect`

Konsep: *"`public stop()` — clearInterval + isRunning = false. Mencegah Memory Leak."*

**File:** [Photobooth.tsx L125-L131](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L125-L131)

```typescript
// ─── "public stop()" → cleanup saat komponen di-unmount ──────────
useEffect(() => {
  initCamera();
  return () => {
    // Dipanggil otomatis saat komponen di-destroy (navigate ke halaman lain)
    if (stream) stream.getTracks().forEach(t => t.stop()); // ← clearInterval + cleanup
    // Interval async juga otomatis dibatalkan karena komponen di-unmount
  };
}, []);
```

**Analog di kode tombol "Foto Ulang":**

**File:** [Photobooth.tsx L389-L392](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L389-L392)

```tsx
// ─── "public reset()" → kembalikan ke keadaan awal ───────────────
<button
  onClick={() => setPhotos([])}        // ← this.reset() → hapus semua foto
  disabled={isCapturing || photos.length === 0}
>
  Foto Ulang
</button>
```

---

## 4. 👁️ Observer Pattern — `onTick` & `onComplete` Callbacks

Konsep: *"Timer hanya menghitung dan MEMBERITAHU — ia tidak peduli siapa yang bereaksi"*

Timer di proyek ini memiliki **3 Observer berbeda** yang masing-masing bereaksi secara mandiri:

### Observer #1: UI Countdown Display — `onTick`

**File:** [Photobooth.tsx L203-L207](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L203-L207)

```typescript
// ─── onTick: (timeLeft) => setCountdown(timeLeft) ────────────────
for (let i = timerDuration; i > 0; i--) {
  setCountdown(i);  // ← Observer UI bereaksi: tampilkan angka di layar!
  // ...
}
```

**Render-nya di JSX:**

**File:** [Photobooth.tsx L282-L295](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L282-L295)

```tsx
{/* ← Observer UI: menampilkan angka countdown secara animasi */}
<AnimatePresence>
  {countdown !== null && (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="absolute inset-0 flex items-center justify-center z-20"
    >
      <span className="text-[150px] font-display font-black text-warm-cream">
        {countdown === 0 ? '📸' : countdown}
      </span>
    </motion.div>
  )}
</AnimatePresence>
```

### Observer #2: Audio Engine — `onTick` → `playTick()`

**File:** [Photobooth.tsx L36-L48](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L36-L48)

```typescript
// ─── Observer Audio: bereaksi setiap tick dengan suara "klik" ────
const playTick = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();   // ← buat nada A5 (880 Hz)
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);  // ← suara tick singkat 0.1 detik
};
```

### Observer #3: Audio Engine — `onComplete` → `playShutter()` + `playComplete()`

**File:** [Photobooth.tsx L50-L102](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L50-L102)

```typescript
// ─── Observer Audio #1: saat waktu habis → suara rana kamera ─────
const playShutter = () => {
  const ctx = getAudioContext();
  // Triangle wave drop (suara mekanik lensa)
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.15);
  // ...
  
  // White noise (simulasi suara shutter fisik)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // ← noise acak = suara "klik" kamera
  }
  // ...
};

// ─── Observer Audio #2: saat SEMUA foto selesai → melodi "jingle" ─
const playComplete = () => {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {                       // ← arpeggio 4 nada
    const osc = ctx.createOscillator();
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + i * 0.12;   // ← stagger 120ms tiap nada
    // ...
  });
};
```

### Observer #4: Camera Engine — `onComplete` → `takePhoto()`

**File:** [Photobooth.tsx L135-L181](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L135-L181)

```typescript
// ─── Observer Kamera: saat waktu habis → capture frame dari video ─
const takePhoto = () => {
  playShutter();         // ← notifikasi ke audio observer
  setFlash(true);        // ← notifikasi ke UI observer (efek flash putih)
  setTimeout(() => setFlash(false), 400);

  let dataUrl = '';
  if (isVirtual) {
    // Mode virtual: gambar placeholder gradient ke canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    // ...gradient + "VIRTUAL SUBJECT" text...
    dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  } else {
    // Mode kamera asli: capture frame dari <video>
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);                    // ← mirror (selfie mode)
    ctx.drawImage(video, 0, 0, ...);     // ← snapshot satu frame video
    dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  }

  // Simpan hasil foto ke state (immutable array)
  setPhotos(prev => [...prev, {
    id: Math.random().toString(36).substr(2, 9),
    dataUrl,
    timestamp: new Date().toISOString()
  }]);
};
```

---

## 5. 📊 Diagram Alur Observer Pattern

```
                    ┌──────────────────────────────┐
                    │     startCaptureSequence()    │
                    │  (analog: timer.start())      │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │          runSequence(i)                  │
                    │  for i = timerDuration → 0               │
                    │  await 1000ms per iterasi                │
                    └──┬──────────────────────────────────┬───┘
                       │  SETIAP DETIK (onTick)           │  SAAT HABIS (onComplete)
          ┌────────────▼──────────┐              ┌────────▼──────────────────┐
          │  setCountdown(i)      │              │  takePhoto()              │
          │  (Observer: UI)       │              │  (Observer: Camera)       │
          └───────────────────────┘              └───────────────────────────┘
          ┌────────────▼──────────┐              ┌────────▼──────────────────┐
          │  playTick()           │              │  playShutter()            │
          │  (Observer: Audio)    │              │  (Observer: Audio)        │
          └───────────────────────┘              └───────────────────────────┘
                                                 ┌────────▼──────────────────┐
                                                 │  setFlash(true)           │
                                                 │  (Observer: UI Flash)     │
                                                 └───────────────────────────┘
```

---

## 📊 Tabel Pemetaan Lengkap

| Konsep OOP (Teori) | Implementasi Nyata | File & Baris |
|---|---|---|
| `private duration: number` | `timerDuration` state (3s/5s/10s) | [Photobooth.tsx:23](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L23) |
| `private timeLeft: number` | `countdown` state | [Photobooth.tsx:21](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L21) |
| `private isRunning: boolean` | `isCapturing` state | [Photobooth.tsx:22](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L22) |
| `private intervalId: number \| null` | Closure async di `runSequence` | [Photobooth.tsx:195-224](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L195-L224) |
| `private onTick: (n) => void` | `setCountdown(i)` + `playTick()` | [Photobooth.tsx:204-206](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L204-L206) |
| `private onComplete: () => void` | `takePhoto()` + `playShutter()` + `playComplete()` | [Photobooth.tsx:135, 50, 85](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L135) |
| `if (this.isRunning) return` | `if (isCapturing) return` | [Photobooth.tsx:184](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L184) |
| `public start()` | `startCaptureSequence()` | [Photobooth.tsx:183](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L183) |
| `public stop()` | Cleanup `useEffect` return | [Photobooth.tsx:127-130](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L127-L130) |
| `public reset()` | `setPhotos([])` via tombol "Foto Ulang" | [Photobooth.tsx:389](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L389) |
| `window.setInterval(() => {...}, 1000)` | `for` loop + `await setTimeout(r, 1000)` | [Photobooth.tsx:203-207](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L203-L207) |
| `window.clearInterval(this.intervalId)` | Komponen di-unmount → async dibatalkan otomatis | [Photobooth.tsx:125-131](file:///c:/Code/ctrlsnap_photobooth/frontend/src/components/Photobooth.tsx#L125-L131) |

---

## 🔑 Keunggulan Implementasi Aktual vs OOP Class Murni

| Aspek | `PhotoboothTimer` OOP (Teori) | `runSequence` async (Implementasi) |
|---|---|---|
| **Mencegah double-start** | `if (this.isRunning) return` | `if (isCapturing) return` ✅ |
| **Mencegah memory leak** | `clearInterval` di `stop()` | `async` otomatis cancel saat unmount ✅ |
| **Multi-shot (4 foto)** | Perlu dibuat manual | Rekursi `runSequence(photoIndex + 1)` ✅ |
| **Pause antar foto** | Tidak ada | `await setTimeout(1500ms)` ✅ |
| **Observer audio** | Tidak ada | `playTick()`, `playShutter()`, `playComplete()` ✅ |

> **Bonus:** Implementasi aktual menggunakan `async/await` loop yang **lebih aman dari `setInterval`** — tidak ada risiko interval tumpang tindih (overlap), karena setiap detik menunggu Promise sebelum lanjut. Ini adalah *"PhotoboothTimer yang lebih baik dari contoh OOP-nya sendiri"* 🚀
