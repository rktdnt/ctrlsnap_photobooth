import React, { useEffect, useState } from 'react';
import { Home, Share2, Download, History, Trash2, Camera, ExternalLink } from 'lucide-react';
import { PhotostripLayout, PhotoFrame } from '../types';

interface Props {
  dataUrl: string;
  layout: PhotostripLayout;
  frame: PhotoFrame;
  sessionMode: 'trial' | 'premium';
  onReset: () => void;
}

interface SessionRecord {
  id: number;
  image_url: string;
  created_at: string;
}

const ResultPage: React.FC<Props> = ({ dataUrl, layout, frame, sessionMode, onReset }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [waNumber, setWaNumber] = useState('');

  // Get or create stable device_id
  const getDeviceId = () => {
    let id = localStorage.getItem('pm_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pm_device_id', id);
    }
    return id;
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const processResult = async () => {
      try {
        setIsUploading(true);
        // 1. Upload to Cloudinary via Backend
        const resUpload = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        });
        if (!resUpload.ok) throw new Error("Upload failed");
        const uploadData = await resUpload.json();
        const finalUrl = uploadData.url;
        setUploadedImageUrl(finalUrl);

        // 2. Log Session to MySQL
        const deviceId = getDeviceId();
        await fetch(`${API_BASE}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: deviceId,
            layout_id: layout.id,
            frame_id: frame.id,
            session_mode: sessionMode,
            image_url: finalUrl
          })
        });

        // 3. Fetch History
        fetchHistory(deviceId);

      } catch (err) {
        console.error("Error processing result:", err);
        // Fallback for demo purposes if backend is down
        setUploadedImageUrl(dataUrl);
      } finally {
        setIsUploading(false);
      }
    };

    processResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async (deviceId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions?device_id=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.warn("Could not fetch history");
    }
  };

  const handleShowQR = async () => {
    setShowQRModal(true);
    if (!qrCodeDataUrl && uploadedImageUrl) {
      try {
        const res = await fetch(`${API_BASE}/api/qrcode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadedImageUrl })
        });
        if (res.ok) {
          const data = await res.json();
          setQrCodeDataUrl(data.qr_data_url);
        }
      } catch (err) {
        console.error("QR gen failed", err);
      }
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Delete failed");
    }
  };

  const handleShareWA = () => {
    const shareUrl = uploadedImageUrl.startsWith('http') ? uploadedImageUrl : 'https://photomatics.app';
    const text = encodeURIComponent(`Lihat hasil photobooth AI saya dari Photomatics! ✨📸\n${shareUrl}`);
    const cleanNumber = waNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleShareWAStatus = () => {
    const shareUrl = uploadedImageUrl.startsWith('http') ? uploadedImageUrl : 'https://photomatics.app';
    const text = encodeURIComponent(`Lihat hasil photobooth AI saya dari Photomatics! ✨📸\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
      <div className="text-center mb-10">
        <h2 className="text-xs font-mono text-neon-cyan tracking-widest uppercase mb-2">SELESAI</h2>
        <h1 className="text-4xl font-display font-bold">Sesi Berhasil Diselesaikan</h1>
        <p className="text-gray-400 mt-2">Momen epik Anda telah diabadikan.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
        {/* Kiri: Result Image (6 col) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative w-full max-w-[400px]">
            {isUploading && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur flex flex-col items-center justify-center rounded-3xl">
                <div className="w-10 h-10 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-mono text-sm tracking-widest text-neon-cyan">MENGUNGGAH...</p>
              </div>
            )}
            <img src={dataUrl} alt="Final Photostrip" className="w-full rounded-2xl shadow-lg" />
          </div>
        </div>

        {/* Kanan: Actions (6 col) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-3xl flex flex-col gap-4">
            <h3 className="font-bold text-xl mb-2">Simpan & Bagikan</h3>
            
            <a 
              href={dataUrl} 
              download="photomatics-strip.jpg"
              className="w-full py-4 rounded-xl shimmer-btn font-bold flex items-center justify-center gap-3 text-lg"
            >
              <Download className="w-5 h-5" /> Download File Kualitas HD
            </a>
            
            <button 
              onClick={handleShowQR}
              disabled={isUploading}
              className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 font-bold flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-5 h-5" /> Tampilkan QR Code
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
              <Camera className="w-3 h-3" /> Foto disimpan sementara di browser Anda dan akan terhapus otomatis dalam 24 jam.
            </p>

            <div className="border-t border-white/10 mt-4 pt-6">
              <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase">Kirim via WhatsApp</h4>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    type="tel" 
                    placeholder="Nomor WA (contoh: 62812...)" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                  />
                  <button 
                    onClick={handleShareWA}
                    className="px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
                  >
                    Kirim
                  </button>
                </div>
                <button 
                  onClick={handleShareWAStatus}
                  className="w-full py-3 rounded-lg border border-white/10 hover:border-[#25D366] hover:text-[#25D366] text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Atau Bagikan ke Status / Kontak Lain
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full py-4 rounded-xl border border-white/10 font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-gray-300"
          >
            <Home className="w-5 h-5" /> Kembali ke Beranda & Mulai Baru
          </button>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-24 max-w-5xl mx-auto">
          <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
            <History className="w-6 h-6 text-brand-via" /> Riwayat Photostrip Anda
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {history.map(item => (
              <div key={item.id} className="glass-panel p-2 rounded-xl group relative">
                <a href={item.image_url} target="_blank" rel="noreferrer" className="block relative aspect-[1/2] rounded-lg overflow-hidden border border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-card p-8 rounded-3xl max-w-sm w-full text-center border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-start to-neon-cyan" />
            
            <h3 className="text-2xl font-display font-bold mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-400 mb-8">Pindai QR Code untuk mengunduh ke galeri HP</p>
            
            <div className="bg-white p-4 rounded-2xl mb-8 mx-auto w-64 h-64 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-via rounded-full animate-spin" />
              )}
            </div>
            
            <button 
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 rounded-xl border border-white/20 font-bold hover:bg-white/5 transition-colors"
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
