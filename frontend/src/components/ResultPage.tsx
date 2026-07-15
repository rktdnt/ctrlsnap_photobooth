import React, { useEffect, useState } from 'react';
import { Home, Share2, Download, History, Trash2, Camera, ExternalLink, Link, Sparkles, Loader2, AlertCircle, Clapperboard } from 'lucide-react';
import { PhotostripLayout, PhotoFrame, CapturedPhoto } from '../types';

interface Props {
  dataUrl: string;
  photos: CapturedPhoto[];
  layout: PhotostripLayout;
  frame: PhotoFrame;
  sessionMode: 'free' | 'premium';
  onReset: () => void;
}

interface SessionRecord {
  id: number;
  image_url: string;
  created_at: string;
}

const ResultPage: React.FC<Props> = ({ dataUrl, photos, onReset }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [waNumber, setWaNumber] = useState('');
  const [copied, setCopied] = useState(false);

  // Live Photo GIF state
  const [gifState, setGifState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [gifDataUrl, setGifDataUrl] = useState<string>('');
  const [gifError, setGifError] = useState<string>('');



  useEffect(() => {
    const processResult = async () => {
      let finalUrl = dataUrl;
      try {
        setIsUploading(true);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

        if (cloudName) {
          const formData = new FormData();
          formData.append('file', dataUrl);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'ctrlsnap');

          const resUpload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });

          if (resUpload.ok) {
            const uploadData = await resUpload.json();
            finalUrl = uploadData.secure_url;
          } else {
            console.warn("Direct Cloudinary upload failed:", await resUpload.text());
          }
        } else {
          console.warn("Cloudinary cloud name not configured on frontend (VITE_CLOUDINARY_CLOUD_NAME).");
        }
      } catch (err) {
        console.warn("Cloudinary upload failed, falling back to local data URL:", err);
      } finally {
        setUploadedImageUrl(finalUrl);
        setIsUploading(false);
      }

      // 2. Save Session to Browser Storage (localStorage & cookies)
      try {
        const newRecord: SessionRecord = {
          id: Date.now(),
          image_url: finalUrl,
          created_at: new Date().toISOString()
        };

        const localHistoryStr = localStorage.getItem('pm_history') || '[]';
        const localHistory = JSON.parse(localHistoryStr) as SessionRecord[];
        localHistory.unshift(newRecord);
        localStorage.setItem('pm_history', JSON.stringify(localHistory));

        // Save backup to cookies (limited to last 10 URL records under 4KB)
        if (!finalUrl.startsWith('data:')) {
          const cookieHistory = localHistory.slice(0, 10);
          document.cookie = `pm_history=${encodeURIComponent(JSON.stringify(cookieHistory))}; path=/; max-age=31536000; SameSite=Lax`;
        }

        fetchHistory();
      } catch (err) {
        console.error("Failed to save session history locally:", err);
      }
    };

    processResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = () => {
    try {
      // 1. Read from localStorage
      const localHistoryStr = localStorage.getItem('pm_history');
      if (localHistoryStr) {
        setHistory(JSON.parse(localHistoryStr));
        return;
      }

      // 2. Fallback to cookies
      const match = document.cookie.match(/(^| )pm_history=([^;]+)/);
      if (match) {
        const cookieHistory = JSON.parse(decodeURIComponent(match[2]));
        setHistory(cookieHistory);
        localStorage.setItem('pm_history', JSON.stringify(cookieHistory));
      }
    } catch (err) {
      console.warn("Could not load history from browser storage:", err);
    }
  };

  const handleShowQR = async () => {
    setShowQRModal(true);
    if (!qrCodeDataUrl && uploadedImageUrl) {
      // Use the free, public QR code generator API directly on frontend
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(uploadedImageUrl)}`;
      setQrCodeDataUrl(qrUrl);
    }
  };

  const handleDeleteHistory = (id: number) => {
    try {
      const localHistoryStr = localStorage.getItem('pm_history') || '[]';
      const localHistory = JSON.parse(localHistoryStr) as SessionRecord[];
      const updatedHistory = localHistory.filter(h => h.id !== id);
      localStorage.setItem('pm_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      const cookieHistory = updatedHistory.slice(0, 10).filter(h => !h.image_url.startsWith('data:'));
      document.cookie = `pm_history=${encodeURIComponent(JSON.stringify(cookieHistory))}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (err) {
      console.error("Delete from browser storage failed:", err);
    }
  };

  const handleShareWA = () => {
    const shareUrl = uploadedImageUrl.startsWith('http') ? uploadedImageUrl : 'https://ctrlsnap.app';
    const text = encodeURIComponent(`Lihat hasil photobooth AI saya dari CTRL+Snap! ✨📸\n${shareUrl}`);
    const cleanNumber = waNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleShareWAStatus = () => {
    const shareUrl = uploadedImageUrl.startsWith('http') ? uploadedImageUrl : 'https://ctrlsnap.app';
    const text = encodeURIComponent(`Lihat hasil photobooth AI saya dari CTRL+Snap! ✨📸\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(uploadedImageUrl)}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleGenerateGif = async () => {
    if (photos.length < 2) {
      setGifError('Minimal 2 foto diperlukan untuk membuat Live Photo GIF.');
      setGifState('error');
      return;
    }
    setGifState('loading');
    setGifError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://ctrlsnap.rypl.my.id';
      const res = await fetch(`${apiBase}/api/media/gif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: photos.map(p => p.dataUrl),
          fps: 6,
          width: 480,
          ping_pong: true,
          quality: 82,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(detail.detail || res.statusText);
      }
      const data = await res.json();
      setGifDataUrl(data.gif_base64);
      setGifState('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGifError(msg);
      setGifState('error');
    }
  };

  return (
    <div className="container mx-auto min-h-screen px-6 py-10 text-ink">
      <div className="text-center mb-10">
        <h2 className="eyebrow mb-2">SELESAI</h2>
        <h1 className="font-display text-5xl font-black">Momenmu sudah siap</h1>
        <p className="mt-3 text-soft-ink">Hasil photostrip siap diunduh dan dibagikan.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
        {/* Kiri: Result Image (6 col) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-[430px] rounded-[2.5rem] bg-muted-blue p-7 shadow-2xl shadow-ink/10">
            {isUploading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[2.5rem] bg-ink/70 backdrop-blur">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-warm-cream border-t-transparent" />
                <p className="font-mono text-sm tracking-widest text-warm-cream">MENGUNGGAH...</p>
              </div>
            )}
            <img src={dataUrl} alt="Final Photostrip" className="w-full rounded-[1.75rem] shadow-xl" />
          </div>
        </div>

        {/* Kanan: Actions (6 col) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="cream-card flex flex-col gap-4 rounded-[2.5rem] p-9">
            <h3 className="mb-1 text-3xl font-black">Simpan & Bagikan</h3>
            <p className="mb-2 text-soft-ink">Pilih cara paling cepat buat menyimpan hasilnya.</p>
            
            <a 
              href={dataUrl} 
              download="ctrlsnap-strip.jpg"
              className="soft-btn-primary flex w-full items-center justify-center gap-3 rounded-full py-4 text-lg font-black"
            >
              <Download className="w-5 h-5" /> Amankan Kualitas HD ⚡
            </a>

            {uploadedImageUrl.startsWith('http') && (
              <button 
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-ink py-4 text-lg font-black transition-colors hover:bg-ink hover:text-warm-cream cursor-pointer"
              >
                <Link className="w-5 h-5" /> {copied ? 'Copied! Cuy 🚀' : 'Copy Link, Spill Circle! 🔗'}
              </button>
            )}
            
            <button 
              onClick={handleShowQR}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-muted-blue py-4 text-lg font-black transition-colors disabled:opacity-50"
            >
              <Share2 className="w-5 h-5" /> Show QR Code 👀
            </button>
            
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-soft-ink">
              <Camera className="w-3 h-3" /> Foto disimpan sementara di browser Anda dan akan terhapus otomatis dalam 24 jam.
            </p>

            <div className="mt-4 border-t border-ink/10 pt-6">
              <h4 className="mb-4 text-sm font-black uppercase text-soft-ink">Kirim via WhatsApp</h4>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    type="tel" 
                    placeholder="Nomor WA (contoh: 62812...)" 
                    className="flex-1 rounded-2xl border border-ink/10 bg-white/55 px-4 py-3 text-sm transition-colors focus:border-ink focus:outline-none"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                  />
                  <button 
                    onClick={handleShareWA}
                    className="cursor-pointer rounded-2xl bg-ink px-6 py-3 text-sm font-black text-warm-cream transition-colors"
                  >
                    Kirim Kuy! 🚀
                  </button>
                </div>
                <button 
                  onClick={handleShareWAStatus}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-ink/10 py-3 text-sm font-black transition-colors hover:border-ink"
                >
                  <Share2 className="w-4 h-4" /> Share Status / Kontak Lain 📢
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={onReset}
            className="soft-btn-secondary flex w-full items-center justify-center gap-2 rounded-full py-4 font-black"
          >
            <Home className="w-5 h-5" /> Balik ke Home, Snap Lagi! 🔄
          </button>
        </div>
      </div>

      {/* Live Photo GIF Section */}
      {photos.length >= 2 && (
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="cream-card rounded-[2.5rem] p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">

              {/* Kiri: info & tombol */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted-blue/40">
                    <Clapperboard className="w-6 h-6 text-ink" />
                  </div>
                  <div>
                    <p className="eyebrow">Fitur Baru ✨</p>
                    <h3 className="font-display text-2xl font-black leading-tight">Live Photo GIF</h3>
                  </div>
                </div>
                <p className="text-soft-ink leading-relaxed text-sm">
                  Ubah {photos.length} foto yang kamu ambil menjadi GIF animasi looping dengan efek <strong>ping-pong</strong> — maju lalu mundur — persis seperti Apple Live Photo.
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-soft-ink">
                  {[`${photos.length} frame`, '6 FPS', 'Ping-pong loop', '480px lebar'].map(t => (
                    <span key={t} className="rounded-full bg-muted-blue/30 px-3 py-1">{t}</span>
                  ))}
                </div>

                {gifState === 'idle' && (
                  <button
                    onClick={handleGenerateGif}
                    className="soft-btn-primary flex items-center justify-center gap-2 rounded-full py-3.5 font-black"
                  >
                    <Sparkles className="w-5 h-5" /> Buat Live Photo GIF 🎬
                  </button>
                )}

                {gifState === 'loading' && (
                  <div className="flex items-center gap-3 rounded-full bg-muted-blue/30 px-6 py-3.5">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-black text-sm">Lagi diproses sama server...</span>
                  </div>
                )}

                {gifState === 'error' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{gifError || 'Gagal generate GIF. Pastikan backend berjalan.'}</span>
                    </div>
                    <button
                      onClick={handleGenerateGif}
                      className="flex items-center justify-center gap-2 rounded-full border-2 border-ink py-3 font-black text-sm hover:bg-ink hover:text-warm-cream transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {gifState === 'done' && (
                  <a
                    href={gifDataUrl}
                    download="ctrlsnap-livephoto.gif"
                    className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-black text-warm-cream hover:bg-ink/80 transition-colors"
                  >
                    <Download className="w-5 h-5" /> Download GIF 📥
                  </a>
                )}
              </div>

              {/* Kanan: preview GIF */}
              <div className="flex-shrink-0 w-full md:w-52">
                {gifState === 'done' && gifDataUrl ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-xl border border-ink/10">
                    <img
                      src={gifDataUrl}
                      alt="Live Photo GIF Preview"
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold text-warm-cream backdrop-blur-sm">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> LIVE
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center rounded-3xl border-2 border-dashed border-ink/15 bg-white/40">
                    {gifState === 'loading' ? (
                      <div className="flex flex-col items-center gap-3 text-soft-ink">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-bold">Processing...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-soft-ink/50 px-4 text-center">
                        <Clapperboard className="w-10 h-10" />
                        <span className="text-xs font-bold">Preview GIF muncul di sini</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-24 max-w-5xl mx-auto">
          <h3 className="mb-8 flex items-center gap-3 font-display text-3xl font-black">
            <History className="h-6 w-6 text-soft-ink" /> Riwayat Photostrip Anda
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {history.map(item => (
              <div key={item.id} className="cream-card group relative rounded-2xl p-2">
                <a href={item.image_url} target="_blank" rel="noreferrer" className="relative block aspect-[1/2] overflow-hidden rounded-xl border border-ink/10">
                  <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="History" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </a>
                <button 
                  onClick={() => handleDeleteHistory(item.id)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-warm-cream p-8 text-center shadow-2xl">
            
            <h3 className="mb-2 font-display text-3xl font-black">Scan QR Code</h3>
            <p className="mb-8 text-sm text-soft-ink">Pindai QR Code untuk mengunduh ke galeri HP</p>
            
            <div className="bg-white p-4 rounded-2xl mb-8 mx-auto w-64 h-64 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cloud-white border-t-ink" />
              )}
            </div>
            
            <button 
              onClick={() => setShowQRModal(false)}
              className="soft-btn-secondary w-full rounded-full py-3 font-black"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;
