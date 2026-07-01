import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Layout as LayoutIcon, Frame, Sparkles, Check, Camera } from 'lucide-react';
import { PhotostripLayout, PhotoFrame, LAYOUTS, FRAMES } from '../types';

interface Props {
  sessionMode: 'trial' | 'premium';
  setSessionMode: (mode: 'trial' | 'premium') => void;
  selectedLayout: PhotostripLayout;
  setSelectedLayout: (layout: PhotostripLayout) => void;
  selectedFrame: PhotoFrame;
  setSelectedFrame: (frame: PhotoFrame) => void;
  onBack: () => void;
  onNext: () => void;
}

const TemplateSelector: React.FC<Props> = ({
  sessionMode, setSessionMode,
  selectedLayout, setSelectedLayout,
  selectedFrame, setSelectedFrame,
  onBack, onNext
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

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
  
  const handleNext = () => {
    // If trial, force to single layout
    if (sessionMode === 'trial') {
      setSelectedLayout(LAYOUTS.find(l => l.id === 'single-1') || LAYOUTS[0]);
    }
    onNext();
  };

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xs font-mono text-brand-via tracking-widest uppercase mb-1">LANGKAH 01 DARI 03</h2>
          <h1 className="text-3xl font-display font-bold">Konfigurasi Photostrip</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Kiri: Pilihan (8 col) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card 1: Session Mode */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-neon-cyan" /> Pilih Mode Sesi</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSessionMode('trial')}
                className={`p-4 rounded-xl border transition-all text-left ${sessionMode === 'trial' ? 'border-brand-via bg-brand-via/10' : 'border-white/10 hover:border-white/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold">Trial Sesi</div>
                  {sessionMode === 'trial' && <Check className="w-5 h-5 text-brand-via" />}
                </div>
                <div className="text-sm text-gray-400 mb-2">1 Jepretan, Frame Dasar, Ada Watermark</div>
                <div className="font-mono text-brand-start font-bold">Rp 0</div>
              </button>
              
              <button 
                onClick={() => setSessionMode('premium')}
                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${sessionMode === 'premium' ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 hover:border-white/30'}`}
              >
                {sessionMode === 'premium' && <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-brand-start/5" />}
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold">Premium Sesi</div>
                    {sessionMode === 'premium' && <Check className="w-5 h-5 text-neon-cyan" />}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Semua Layout, Full Frame, HD Tanpa Watermark</div>
                  <div className="font-mono text-neon-cyan font-bold">Rp 10.000</div>
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Layout */}
          <div className={`glass-panel p-6 rounded-2xl transition-opacity ${sessionMode === 'trial' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><LayoutIcon className="w-5 h-5 text-brand-via" /> Pilih Layout</h3>
              {sessionMode === 'trial' && <span className="text-xs text-brand-start font-mono bg-brand-start/20 px-2 py-1 rounded">TERKUNCI DI TRIAL</span>}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${selectedLayout.id === layout.id ? 'border-brand-via bg-brand-via/10' : 'border-white/10 hover:border-white/30'}`}
                >
                  <div className="w-16 h-16 bg-white/5 rounded border border-white/10 p-2 flex flex-col gap-1">
                    {/* Visual representation of layout */}
                    {layout.id === 'single-1' && <div className="w-full h-full bg-gray-500 rounded-sm" />}
                    {layout.id === 'classic-3' && Array(3).fill(0).map((_, i) => <div key={i} className="w-full flex-1 bg-gray-500 rounded-sm" />)}
                    {layout.id === 'strip-4' && Array(4).fill(0).map((_, i) => <div key={i} className="w-full flex-1 bg-gray-500 rounded-sm" />)}
                    {layout.id === 'grid-4' && (
                      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                        {Array(4).fill(0).map((_, i) => <div key={i} className="w-full h-full bg-gray-500 rounded-sm" />)}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold">{layout.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Frame */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Frame className="w-5 h-5 text-neon-cyan" /> Pilih Frame Awal</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FRAMES.map(frame => {
                const isLocked = sessionMode === 'trial' && frame.id !== 'sleek-minimalist';
                return (
                  <button
                    key={frame.id}
                    onClick={() => !isLocked && setSelectedFrame(frame)}
                    className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 relative ${isLocked ? 'opacity-50 cursor-not-allowed' : selectedFrame.id === frame.id ? 'border-brand-via bg-brand-via/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner flex-shrink-0 border border-white/20" style={{ backgroundColor: frame.bgColor }} />
                    <div className="flex-1 truncate">
                      <div className="text-sm font-bold truncate">{frame.name}</div>
                      {isLocked && <div className="text-[10px] text-gray-400 mt-1">Premium Only</div>}
                    </div>
                    {selectedFrame.id === frame.id && <Check className="w-4 h-4 text-brand-via absolute right-3" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Kanan: Live Preview (4 col, sticky) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 glass-panel p-6 rounded-2xl border-brand-via/30 flex flex-col items-center">
            <h3 className="text-sm font-mono text-gray-400 mb-6 w-full text-center tracking-widest">LIVE PREVIEW</h3>
            
            {/* The Strip Preview */}
            <motion.div 
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-[200px] shadow-2xl relative p-4"
              style={{ backgroundColor: selectedFrame.bgColor }}
            >
              {selectedFrame.pattern === 'radial-dot' && (
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: selectedFrame.textColor }} />
              )}
              
              <div className={`relative z-10 w-full flex ${selectedLayout.id === 'grid-4' ? 'flex-wrap gap-2' : 'flex-col gap-2'}`}>
                {Array(sessionMode === 'trial' ? 1 : selectedLayout.rows * selectedLayout.cols).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className={`bg-gray-200/20 backdrop-blur-sm rounded-sm overflow-hidden relative ${selectedLayout.id === 'grid-4' ? 'w-[calc(50%-4px)] aspect-square' : 'w-full aspect-[4/3]'} border border-white/10 flex items-center justify-center`}
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
                PHOTOMATICS
              </div>
            </motion.div>
            
            <div className="w-full mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 text-sm">Total Tagihan</span>
                <span className="text-xl font-bold font-mono text-neon-cyan">
                  Rp {sessionMode === 'trial' ? '0' : '10.000'}
                </span>
              </div>
              <button 
                onClick={handleNext}
                className="w-full py-4 rounded-xl shimmer-btn font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-via/20"
              >
                Lanjutkan ke Photobooth <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
