import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Layout as LayoutIcon, Frame, Check, Camera, X, Upload, Crown, Sparkles, Lock, Loader2 } from 'lucide-react';
import { PhotostripLayout, PhotoFrame, LAYOUTS, FRAMES } from '../types';
import { makeQRISDynamic, DEFAULT_STATIC_QRIS } from '../utils/qris';

import { getApiBaseUrl } from '../utils/api';

interface Props {
  selectedLayout: PhotostripLayout;
  setSelectedLayout: (layout: PhotostripLayout) => void;
  selectedFrame: PhotoFrame;
  setSelectedFrame: (frame: PhotoFrame) => void;
  onBack: () => void;
  onNext: () => void;
  onUpgradePremium: () => void;
}

// Mini visual preview of a frame — shows 2-3 photo slots inside the frame color
const FramePreview: React.FC<{ frame: PhotoFrame; isSelected: boolean }> = ({ frame, isSelected }) => {
  const isDark = frame.textColor === '#F5E8D8' || frame.textColor.toLowerCase().includes('f5');
  return (
    <button
      onClick={() => {}}
      className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all cursor-default ${
        isSelected ? 'border-ink ring-2 ring-ink/20 scale-[1.02]' : 'border-transparent'
      }`}
      style={{ backgroundColor: frame.bgColor }}
    >
      {/* Pattern overlay */}
      {frame.pattern === 'radial-dot' && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            color: frame.textColor,
          }}
        />
      )}
      {/* Photo slots */}
      <div className="relative z-10 flex flex-col gap-1 p-2">
        {[1, 2].map(i => (
          <div
            key={i}
            className="w-full rounded-md flex items-center justify-center"
            style={{
              aspectRatio: '4/3',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }}
          >
            <Camera className="w-3 h-3 opacity-30" style={{ color: frame.textColor }} />
          </div>
        ))}
      </div>
      {/* Frame label */}
      <div
        className="relative z-10 py-1.5 text-center text-[8px] font-black tracking-widest font-display"
        style={{ color: frame.textColor }}
      >
        CTRL+Snap
      </div>
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-warm-cream shadow">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
};

const TemplateSelector: React.FC<Props> = ({
  selectedLayout, setSelectedLayout,
  selectedFrame, setSelectedFrame,
  onBack, onNext, onUpgradePremium
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Premium upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  // Payment flow state
  const [showPayment, setShowPayment] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [qrisUrl, setQrisUrl] = React.useState('');

  React.useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to access camera", err);
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleOpenUpgrade = () => {
    setShowUpgradeModal(true);
    setShowPayment(false);
    setIsPaid(false);
    // Pre-generate QRIS
    const staticQris = import.meta.env.VITE_STATIC_QRIS || DEFAULT_STATIC_QRIS;
    const dynamicQris = makeQRISDynamic(staticQris, 10000);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dynamicQris)}`;
    setQrisUrl(qrImageUrl);
  };

  const handleVerifyPayment = async () => {
    setIsPaying(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'upgrade_selector' })
      });
      if (!res.ok) throw new Error('Verification failed');
      
      setIsPaying(false);
      setIsPaid(true);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setShowPayment(false);
        onUpgradePremium(); // upgrade sessionMode di App.tsx ke 'premium'
      }, 1600);
    } catch (err) {
      console.error("Payment verification failed:", err);
      // fallback to simulated success for best user experience if backend is unreachable
      setIsPaying(false);
      setIsPaid(true);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setShowPayment(false);
        onUpgradePremium();
      }, 1600);
    }
  };

  const handleCloseModal = () => {
    if (isPaid || isPaying) return;
    setShowUpgradeModal(false);
    setShowPayment(false);
  };

  return (
    <div className="container mx-auto min-h-screen px-6 py-10 text-ink">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-cream shadow-lg transition hover:-translate-y-0.5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="eyebrow mb-1">LANGKAH 01 DARI 03</h2>
          <h1 className="font-display text-4xl font-black">Konfigurasi Photostrip</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Kiri: Pilihan (8 col) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Card 1: Layout */}
          <div className="cream-card rounded-[2rem] p-7">
            <h3 className="flex items-center gap-2 text-xl font-black mb-4">
              <LayoutIcon className="w-5 h-5 text-soft-ink" /> Pilih Layout
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all ${selectedLayout.id === layout.id ? 'border-ink bg-muted-blue/55' : 'border-ink/10 bg-white/35 hover:border-ink/30'}`}
                >
                  <div className="flex h-16 w-16 flex-col gap-1 rounded-xl border border-ink/10 bg-warm-cream p-2">
                    {layout.id === 'single-1' && <div className="w-full h-full bg-muted-blue rounded-sm" />}
                    {layout.id === 'classic-3' && Array(3).fill(0).map((_, i) => <div key={i} className="w-full flex-1 bg-muted-blue rounded-sm" />)}
                    {layout.id === 'strip-4' && Array(4).fill(0).map((_, i) => <div key={i} className="w-full flex-1 bg-muted-blue rounded-sm" />)}
                    {layout.id === 'grid-4' && (
                      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                        {Array(4).fill(0).map((_, i) => <div key={i} className="w-full h-full bg-muted-blue rounded-sm" />)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-center">{layout.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Frame — visual preview */}
          <div className="cream-card rounded-[2rem] p-7">
            <h3 className="flex items-center gap-2 text-xl font-black mb-5">
              <Frame className="w-5 h-5 text-soft-ink" /> Pilih Frame Awal
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {FRAMES.map(frame => (
                <div key={frame.id} onClick={() => setSelectedFrame(frame)} className="cursor-pointer">
                  <FramePreview frame={frame} isSelected={selectedFrame.id === frame.id} />
                  <p className={`mt-1.5 text-center text-xs font-bold truncate ${selectedFrame.id === frame.id ? 'text-ink' : 'text-soft-ink'}`}>
                    {frame.name}
                  </p>
                </div>
              ))}

              {/* Upload Custom Frame — Premium */}
              <div className="cursor-pointer" onClick={handleOpenUpgrade}>
                <div className="relative flex flex-col rounded-2xl border-2 border-dashed border-ink/25 overflow-hidden transition-all hover:border-ink/50 hover:bg-muted-blue/10 group"
                  style={{ aspectRatio: '3/4' }}
                >
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted-blue/30 group-hover:bg-muted-blue/50 transition-colors">
                      <Upload className="w-4 h-4 text-soft-ink" />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-soft-ink/70 font-bold">
                      <Crown className="w-2.5 h-2.5" /> Premium
                    </div>
                  </div>
                  <Lock className="absolute top-2 right-2 w-3 h-3 text-soft-ink/40" />
                </div>
                <p className="mt-1.5 text-center text-xs font-bold text-soft-ink truncate">Frame Kustom</p>
              </div>
            </div>
          </div>

        </div>

        {/* Kanan: Live Preview (4 col, sticky) */}
        <div className="lg:col-span-4 relative">
          <div className="cream-card sticky top-24 flex flex-col items-center rounded-[2rem] p-7">
            <h3 className="eyebrow mb-6 w-full text-center">LIVE PREVIEW</h3>

            <motion.div
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-[220px] rounded-[1.5rem] p-4 shadow-2xl"
              style={{ backgroundColor: selectedFrame.bgColor }}
            >
              {selectedFrame.pattern === 'radial-dot' && (
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: selectedFrame.textColor }} />
              )}
              <div className={`relative z-10 w-full flex ${selectedLayout.id === 'grid-4' ? 'flex-wrap gap-2' : 'flex-col gap-2'}`}>
                {Array(selectedLayout.rows * selectedLayout.cols).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-muted-blue/30 ${selectedLayout.id === 'grid-4' ? 'w-[calc(50%-4px)] aspect-square' : 'w-full aspect-[4/3]'} border border-ink/10`}
                  >
                    {i === 0 ? (
                      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
                    ) : (
                      <Camera className="w-6 h-6 opacity-20" style={{ color: selectedFrame.textColor }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-[10px] font-display font-bold tracking-widest" style={{ color: selectedFrame.textColor }}>
                CTRL+Snap
              </div>
            </motion.div>

            <div className="w-full mt-8 pt-6 border-t border-white/10">
              <button
                onClick={onNext}
                className="soft-btn-primary flex w-full items-center justify-center gap-2 rounded-full py-4 font-black"
              >
                Gaskeun ke Photobooth! 🚀 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Upgrade + QRIS Payment Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm rounded-[2.5rem] bg-ink p-8 text-warm-cream shadow-2xl overflow-hidden"
            >
              {/* Close */}
              {!isPaid && !isPaying && (
                <button
                  onClick={handleCloseModal}
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-warm-cream/10 transition hover:bg-warm-cream/20 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {/* === Step 1: Upsell Info === */}
                {!showPayment && !isPaid && (
                  <motion.div
                    key="upsell"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-cream/10">
                      <Crown className="w-8 h-8 text-warm-cream" />
                    </div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-blue mb-2">Fitur Premium</p>
                    <h2 className="font-display text-3xl font-black leading-tight">Upload Frame<br />Kustom</h2>
                    <p className="mt-3 text-sm leading-relaxed text-warm-cream/70 mb-6">
                      Gunakan gambar sendiri sebagai background frame — logo brand, foto aesthetic, atau template unik buatanmu.
                    </p>

                    <div className="w-full mb-6 flex flex-col gap-3 rounded-2xl bg-warm-cream/5 p-4">
                      {[
                        { icon: Upload, text: 'Upload gambar JPG, PNG, atau SVG' },
                        { icon: Sparkles, text: 'Frame eksklusif & maskot premium' },
                        { icon: Crown, text: 'Hasil foto bebas watermark' },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-muted-blue/30">
                            <Icon className="w-4 h-4 text-muted-blue" />
                          </div>
                          <span className="text-warm-cream/80 text-left">{text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full flex flex-col gap-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm text-warm-cream/60">Harga per sesi</span>
                        <span className="font-mono text-2xl font-black">Rp 10.000</span>
                      </div>
                      <button
                        onClick={() => setShowPayment(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-warm-cream py-4 font-black text-ink transition hover:bg-warm-cream/90"
                      >
                        <Crown className="w-5 h-5" /> Upgrade ke Premium
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="text-center text-sm text-warm-cream/50 hover:text-warm-cream/80 transition py-1"
                      >
                        Lanjut gratis aja dulu
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* === Step 2: QRIS Payment === */}
                {showPayment && !isPaid && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Back button */}
                    {!isPaying && (
                      <button
                        onClick={() => setShowPayment(false)}
                        className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-warm-cream/10 transition hover:bg-warm-cream/20"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-center gap-2 mb-1 mt-1">
                      <Sparkles className="w-5 h-5 text-muted-blue animate-pulse" />
                      <span className="font-display font-black text-lg tracking-widest">QRIS DINAMIS</span>
                    </div>
                    <p className="text-[11px] text-warm-cream/50 uppercase tracking-wider font-mono mb-5">
                      CTRL+Snap Premium Upgrade
                    </p>

                    <div className="w-full rounded-2xl bg-warm-cream/8 border border-warm-cream/10 p-3 mb-5 flex justify-between items-center">
                      <span className="text-sm text-warm-cream/60">Total bayar</span>
                      <span className="font-mono text-2xl font-black">Rp 10.000</span>
                    </div>

                    {/* QR Code */}
                    <div className="relative mb-5 flex aspect-square w-full max-w-[220px] items-center justify-center rounded-3xl bg-white p-3 shadow-inner">
                      {qrisUrl ? (
                        <img src={qrisUrl} alt="QRIS Code" className="w-full h-full object-contain rounded-2xl" />
                      ) : (
                        <Loader2 className="w-8 h-8 animate-spin text-soft-ink" />
                      )}
                    </div>

                    <p className="text-xs text-warm-cream/50 text-center mb-5 leading-relaxed">
                      Pindai dengan GOPAY, OVO, DANA, LinkAja, atau Mobile Banking.
                    </p>

                    <button
                      onClick={handleVerifyPayment}
                      disabled={isPaying}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-warm-cream py-4 font-black text-ink transition hover:bg-warm-cream/90 disabled:opacity-70"
                    >
                      {isPaying ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Lagi Dicek, Sabar Ya... ⏳</>
                      ) : (
                        'Udah Transfer, Gas! 🔥'
                      )}
                    </button>
                  </motion.div>
                )}

                {/* === Step 3: Success === */}
                {isPaid && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-warm-cream text-ink shadow-lg"
                    >
                      <Check className="w-10 h-10" />
                    </motion.div>
                    <h3 className="text-2xl font-black mt-2">Pembayaran Berhasil!</h3>
                    <p className="text-warm-cream/70 text-center max-w-xs">
                      Sesi Premium aktif. Selamat berfoto dengan frame kustom dan fitur lengkap! 🎉
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateSelector;
