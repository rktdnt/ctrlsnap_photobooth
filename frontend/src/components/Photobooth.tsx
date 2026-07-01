import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, ChevronLeft, RefreshCw, Sparkles, MonitorOff, MonitorPlay } from 'lucide-react';
import { PhotostripLayout, CapturedPhoto, FILTERS, PhotoFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  layout: PhotostripLayout;
  onBack: () => void;
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
}

const Photobooth: React.FC<Props> = ({ layout, onBack, onPhotosCaptured }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVirtual, setIsVirtual] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>(FILTERS[0]);
  
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(3);
  const [flash, setFlash] = useState(false);

  // Audio synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playTick = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playShutter = () => {
    const ctx = getAudioContext();
    
    // Triangle wave drop
    const osc = ctx.createOscillator();
    const gainOsc = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.15);
    gainOsc.gain.setValueAtTime(0.5, ctx.currentTime);
    gainOsc.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gainOsc);
    gainOsc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    // White noise
    const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gainNoise = ctx.createGain();
    // Shutter sound envelope
    gainNoise.gain.setValueAtTime(0, ctx.currentTime);
    gainNoise.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNoise.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    noise.connect(gainNoise);
    gainNoise.connect(ctx.destination);
    noise.start();
  };

  const playComplete = () => {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  };

  // Camera setup
  const initCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 800 }, height: { ideal: 600 }, facingMode: 'user' },
        audio: false
      });
      setStream(newStream);
      setIsVirtual(false);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn("Camera access failed, falling back to virtual mode", err);
      setIsVirtual(true);
    }
  }, [stream]);

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPhotos = layout.cols * layout.rows;
  
  const takePhoto = () => {
    playShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 400);

    let dataUrl = '';
    if (isVirtual) {
      // Virtual mode: Create a placeholder image
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      // Draw gradient background
      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, '#4f46e5');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIRTUAL SUBJECT', 400, 300);
      dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    } else {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        
        // Mirror context before drawing
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
    }

    if (dataUrl) {
      setPhotos(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        dataUrl,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const startCaptureSequence = async () => {
    if (isCapturing) return;
    
    // Ensure AudioContext is resumed (browser policy)
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsCapturing(true);
    setPhotos([]);

    const runSequence = async (photoIndex: number) => {
      if (photoIndex >= totalPhotos) {
        setIsCapturing(false);
        playComplete();
        return;
      }

      // Countdown
      for (let i = timerDuration; i > 0; i--) {
        setCountdown(i);
        playTick();
        await new Promise(r => setTimeout(r, 1000));
      }
      
      setCountdown(0); // Smile!
      await new Promise(r => setTimeout(r, 200));
      takePhoto();
      setCountdown(null);

      // Delay before next shot
      if (photoIndex < totalPhotos - 1) {
        await new Promise(r => setTimeout(r, 1500));
        runSequence(photoIndex + 1);
      } else {
        setIsCapturing(false);
        playComplete();
      }
    };

    runSequence(0);
  };

  const virtualImages = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=600&fit=crop'
  ];

  return (
    <div className="container mx-auto px-6 py-8 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} disabled={isCapturing} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xs font-mono text-neon-cyan tracking-widest uppercase mb-1">LANGKAH 02 DARI 03</h2>
            <h1 className="text-2xl font-display font-bold">Ambil Foto</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsVirtual(!isVirtual)}
            disabled={isCapturing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${isVirtual ? 'border-brand-via text-brand-via bg-brand-via/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
          >
            {isVirtual ? <MonitorOff className="w-4 h-4" /> : <MonitorPlay className="w-4 h-4" />}
            {isVirtual ? 'Virtual Mode' : 'Kamera Asli'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-12 gap-8">
        {/* Main Camera View (8 col) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {flash && <div className="camera-flash" />}
            
            {isVirtual ? (
              <img 
                src={virtualImages[photos.length % virtualImages.length]} 
                className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} 
                alt="Virtual Subject" 
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} 
              />
            )}

            {/* Countdown Overlay */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center z-20"
                >
                  <span className="text-[150px] font-display font-bold text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                    {countdown === 0 ? '📸' : countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Filters List */}
          <div className="glass-panel p-4 rounded-2xl overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter)}
                  disabled={isCapturing}
                  className={`flex flex-col items-center gap-2 w-24 flex-shrink-0 transition-transform ${selectedFilter.id === filter.id ? 'scale-105' : 'hover:scale-105'}`}
                >
                  <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${selectedFilter.id === filter.id ? 'border-brand-via' : 'border-transparent'}`}>
                    <img 
                      src={virtualImages[0]} 
                      className={`w-full h-full object-cover ${filter.className}`} 
                      alt={filter.name} 
                    />
                  </div>
                  <span className={`text-[10px] font-bold text-center ${selectedFilter.id === filter.id ? 'text-brand-via' : 'text-gray-400'}`}>
                    {filter.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Progress & Actions (4 col) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Progres Sesi</h3>
              <div className="text-neon-cyan font-mono font-bold bg-neon-cyan/10 px-3 py-1 rounded-full text-sm">
                {photos.length} / {totalPhotos}
              </div>
            </div>

            {/* Timer Selection */}
            <div className="mb-6">
              <label className="text-xs font-mono text-gray-400 mb-2 block">DURASI TIMER</label>
              <div className="flex gap-2">
                {[3, 5, 10].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimerDuration(t)}
                    disabled={isCapturing}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${timerDuration === t ? 'border-brand-via bg-brand-via/20 text-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            {!isCapturing && photos.length < totalPhotos && (
              <button
                onClick={startCaptureSequence}
                className="w-full py-4 rounded-xl shimmer-btn font-bold flex items-center justify-center gap-2 text-lg shadow-lg shadow-brand-via/20 mb-6"
              >
                <Camera className="w-6 h-6" />
                Mulai Jepret Otomatis
              </button>
            )}

            {isCapturing && (
              <div className="w-full py-4 rounded-xl bg-red-500/20 border border-red-500 text-red-500 font-bold flex items-center justify-center gap-2 text-lg mb-6 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Sesi Berjalan...
              </div>
            )}

            {/* Thumbnails Grid */}
            <div className="flex-1 min-h-[200px] bg-black/30 rounded-xl p-4 border border-white/5">
              <div className={`grid gap-2 ${layout.id === 'grid-4' ? 'grid-cols-2' : layout.id === 'single-1' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {Array(totalPhotos).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-white/5 rounded border border-white/10 overflow-hidden relative flex items-center justify-center">
                    {photos[i] ? (
                      <img src={photos[i].dataUrl} className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} alt={`Shot ${i+1}`} />
                    ) : (
                      <span className="text-white/20 font-display font-bold text-2xl">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setPhotos([])}
                disabled={isCapturing || photos.length === 0}
                className="w-full py-3 rounded-xl border border-white/20 font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Foto Ulang
              </button>
              
              <button
                onClick={() => onPhotosCaptured(photos)}
                disabled={photos.length < totalPhotos || isCapturing}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg disabled:opacity-50 transition-all shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5" />
                Hias & Kustomisasi Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Photobooth;
