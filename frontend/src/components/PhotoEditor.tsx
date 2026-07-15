import React, { useState, useRef, useEffect } from 'react';
import { CapturedPhoto, PhotostripLayout, PhotoFrame, PhotoFilter, Sticker, TextItem, PlacedSticker, FILTERS, STICKERS, FRAMES } from '../types';
import { ChevronLeft, Download, Type, Image as ImageIcon, Smile, Palette, Trash2, Crown, X, Sparkles, Loader2, Check } from 'lucide-react';
import { makeQRISDynamic, DEFAULT_STATIC_QRIS } from '../utils/qris';

interface Props {
  photos: CapturedPhoto[];
  layout: PhotostripLayout;
  initialFrame: PhotoFrame;
  sessionMode: 'free' | 'premium';
  onUpgradePremium: () => void;
  onBack: () => void;
  onSave: (compiledDataUrl: string) => void;
}

const PhotoEditor: React.FC<Props> = ({ photos, layout, initialFrame, sessionMode, onUpgradePremium, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'sticker' | 'text' | 'frame' | 'custom'>('filter');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customFrameBgImage, setCustomFrameBgImage] = useState<string | null>(null);

  const handleCustomColorChange = (color: string) => {
    setSelectedFrame(prev => ({
      ...prev,
      id: 'custom-frame',
      name: 'Custom Frame',
      bgColor: color
    }));
  };

  const handleCustomTextColorChange = (textColor: string) => {
    setSelectedFrame(prev => ({
      ...prev,
      textColor: textColor
    }));
  };
  
  // Editor State
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>(FILTERS[0]);
  const [selectedFrame, setSelectedFrame] = useState<PhotoFrame>(initialFrame);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  
  // Text Input State
  const [inputText, setInputText] = useState('');
  
  // Compiler state
  const [isCompiling, setIsCompiling] = useState(false);
  
  // Drag state
  const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'sticker' | 'text' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Premium QRIS modal state
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumShowPayment, setPremiumShowPayment] = useState(false);
  const [isPremiumPaying, setIsPremiumPaying] = useState(false);
  const [isPremiumPaid, setIsPremiumPaid] = useState(false);
  const [premiumQrisUrl, setPremiumQrisUrl] = useState('');

  const handleOpenPremium = () => {
    setShowPremiumModal(true);
    setPremiumShowPayment(false);
    setIsPremiumPaid(false);
    const staticQris = import.meta.env.VITE_STATIC_QRIS || DEFAULT_STATIC_QRIS;
    const dynamicQris = makeQRISDynamic(staticQris, 10000);
    setPremiumQrisUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dynamicQris)}`);
  };

  const handleVerifyPremium = () => {
    setIsPremiumPaying(true);
    setTimeout(() => {
      setIsPremiumPaying(false);
      setIsPremiumPaid(true);
      setTimeout(() => {
        setShowPremiumModal(false);
        setPremiumShowPayment(false);
        onUpgradePremium();
      }, 1500);
    }, 2500);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'sticker' | 'text') => {
    e.preventDefault();
    setDraggingItem({ id, type });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingItem || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      if (draggingItem.type === 'sticker') {
        setPlacedStickers(prev => prev.map(s => s.id === draggingItem.id ? { ...s, x: clampedX, y: clampedY } : s));
      } else if (draggingItem.type === 'text') {
        setTexts(prev => prev.map(t => t.id === draggingItem.id ? { ...t, x: clampedX, y: clampedY } : t));
      }
    };

    const handlePointerUp = () => {
      setDraggingItem(null);
    };

    if (draggingItem) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingItem]);

  // Editor Live Preview (using DOM for live preview, Canvas only for final compile)
  
  const handleAddSticker = (sticker: Sticker) => {
    setPlacedStickers(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      emoji: sticker.emoji,
      x: 50,
      y: 20 + (prev.length * 5), // Cascade slightly
      scale: 1,
      rotation: 0
    }]);
  };

  const handleAddText = () => {
    if (!inputText.trim()) return;
    setTexts(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      text: inputText,
      color: '#FFFFFF',
      fontFamily: 'Outfit',
      fontSize: 24,
      x: 50,
      y: 90
    }]);
    setInputText('');
  };

  // Compiler Engine
  const compilePhotostrip = async () => {
    setIsCompiling(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get 2d context");

      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // 1. Calculate dimensions
      const CANVAS_WIDTH = 600;
      let CANVAS_HEIGHT = 600;
      const PADDING = 32;
      let slotWidth = CANVAS_WIDTH - (PADDING * 2);
      let slotHeight = 400;

      switch(layout.id) {
        case 'single-1':
          CANVAS_HEIGHT = 680;
          slotHeight = 500;
          break;
        case 'classic-3':
          CANVAS_HEIGHT = 1600;
          slotHeight = 440;
          break;
        case 'strip-4':
          CANVAS_HEIGHT = 2100;
          slotHeight = 430;
          break;
        case 'grid-4':
          CANVAS_HEIGHT = 720;
          slotWidth = (CANVAS_WIDTH - (PADDING * 3)) / 2;
          slotHeight = 260;
          break;
      }

      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // 2. Draw Background Frame
      if (customFrameBgImage) {
        const bgImgEl = await loadImage(customFrameBgImage);
        ctx.drawImage(bgImgEl, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = selectedFrame.bgColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (selectedFrame.pattern === 'radial-dot') {
          // Simple dot pattern simulation
          ctx.fillStyle = selectedFrame.textColor;
          ctx.globalAlpha = 0.1;
          for (let x = 0; x < CANVAS_WIDTH; x += 10) {
            for (let y = 0; y < CANVAS_HEIGHT; y += 10) {
              ctx.beginPath();
              ctx.arc(x, y, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1.0;
        }
      }

      // 3. Draw Photos with aspect-fill and filter tint
      for (let i = 0; i < photos.length; i++) {
        const img = await loadImage(photos[i].dataUrl);
        
        let x = PADDING;
        let y = PADDING + (i * (slotHeight + PADDING));

        if (layout.id === 'grid-4') {
          const col = i % 2;
          const row = Math.floor(i / 2);
          x = PADDING + (col * (slotWidth + PADDING));
          y = PADDING + (row * (slotHeight + PADDING));
        }

        ctx.save();
        // Clip area
        ctx.beginPath();
        ctx.rect(x, y, slotWidth, slotHeight);
        ctx.clip();

        // Aspect Fill calculation
        const imgAspect = img.width / img.height;
        const slotAspect = slotWidth / slotHeight;
        let dWidth, dHeight, dx, dy;

        if (imgAspect > slotAspect) {
          dHeight = slotHeight;
          dWidth = slotHeight * imgAspect;
          dx = x - (dWidth - slotWidth) / 2;
          dy = y;
        } else {
          dWidth = slotWidth;
          dHeight = slotWidth / imgAspect;
          dx = x;
          dy = y - (dHeight - slotHeight) / 2;
        }

        // Apply mirror horizontally for natural feel
        ctx.translate(x + slotWidth / 2, y + slotHeight / 2);
        ctx.scale(-1, 1);
        ctx.translate(-(x + slotWidth / 2), -(y + slotHeight / 2));

        ctx.drawImage(img, dx, dy, dWidth, dHeight);
        
        // Remove mirror for overlay
        ctx.restore();

        // Apply Tint Overlay based on filter
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, slotWidth, slotHeight);
        
        if (selectedFilter.id === 'glamour') {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
        } else if (selectedFilter.id === 'kodak') {
          ctx.fillStyle = 'rgba(251,191,36,0.08)'; // Amber tint
        } else if (selectedFilter.id === 'cyberpunk') {
          ctx.fillStyle = 'rgba(236,72,153,0.08)'; // Pink tint
        } else if (selectedFilter.id === 'monochrome') {
          // Desaturate is hard with pure canvas without pixel manipulation, we just add dark overlay
          ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
        } else if (selectedFilter.id === 'popart') {
          ctx.fillStyle = 'rgba(217,70,239,0.1)'; // Magenta tint
        } else {
          ctx.fillStyle = 'transparent';
        }
        
        ctx.fill();
        
        // Stroke
        ctx.lineWidth = 1;
        ctx.strokeStyle = `${selectedFrame.textColor}33`; // 20% opacity
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Stickers
      placedStickers.forEach(sticker => {
        ctx.save();
        const px = (sticker.x / 100) * CANVAS_WIDTH;
        const py = (sticker.y / 100) * CANVAS_HEIGHT;
        
        ctx.translate(px, py);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        
        const fontSize = 48 * sticker.scale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        
        ctx.restore();
      });

      // 5. Draw Texts
      texts.forEach(t => {
        ctx.save();
        const px = (t.x / 100) * CANVAS_WIDTH;
        const py = (t.y / 100) * CANVAS_HEIGHT;
        
        ctx.font = `bold ${t.fontSize * 1.5}px ${t.fontFamily}, sans-serif`; // upscale for high-res
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = t.color;
        
        if (selectedFrame.bgColor.toUpperCase() === '#FFFFFF') {
          ctx.shadowColor = 'rgba(0,0,0,0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        }
        
        ctx.fillText(t.text, px, py);
        ctx.restore();
      });

      // 6. Custom Image (Mascot)
      if (customImage) {
        const customImgEl = await loadImage(customImage);
        ctx.save();
        const size = 120; // Size of the overlay image
        // Place bottom left
        ctx.drawImage(customImgEl, 24, CANVAS_HEIGHT - size - 24, size, size);
        ctx.restore();
      }

      // 7. Watermark Footer
      ctx.save();
      ctx.fillStyle = selectedFrame.textColor;
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('CTRL+Snap', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 24);
      ctx.restore();

      // Final output
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onSave(dataUrl);

    } catch (err) {
      console.error("Compile failed", err);
      alert("Gagal memproses gambar");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <>
    <div className="container mx-auto flex min-h-screen flex-col px-6 py-8 text-ink">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-cream shadow-lg transition hover:-translate-y-0.5">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="eyebrow mb-1">LANGKAH 03 DARI 03</h2>
            <h1 className="font-display text-4xl font-black">Hias & Kustomisasi Foto</h1>
          </div>
        </div>

        <button 
          onClick={compilePhotostrip}
          disabled={isCompiling}
          className="soft-btn-primary flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black"
        >
          {isCompiling ? 'Lagi Diproses... ⏳' : (
            <><Download className="w-4 h-4" /> Simpan & Spill Hasilnya! ✨</>
          )}
        </button>
      </div>

      <div className="flex-1 grid lg:grid-cols-12 gap-8">
        {/* Kiri: Live DOM Preview (6 col) */}
        <div className="blue-card flex max-h-[74vh] items-center justify-center overflow-hidden rounded-[2.5rem] p-8 lg:col-span-6">
          <div 
            ref={containerRef}
            className="relative max-h-full max-w-full touch-none overflow-hidden rounded-[2rem] shadow-2xl transition-colors duration-500 p-4"
            style={{ 
              backgroundColor: selectedFrame.bgColor,
              backgroundImage: customFrameBgImage ? `url(${customFrameBgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              aspectRatio: layout.id === 'single-1' ? '600/680' : layout.id === 'classic-3' ? '600/1600' : layout.id === 'strip-4' ? '600/2100' : '600/720',
              height: '100%',
              maxWidth: '280px'
            }}
          >
            {selectedFrame.pattern === 'radial-dot' && (
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: selectedFrame.textColor }} />
            )}

            <div className={`relative z-10 w-full h-full flex ${layout.id === 'grid-4' ? 'flex-wrap gap-4' : 'flex-col gap-4'}`}>
              {photos.map((p, i) => (
                <div 
                  key={i} 
                  className={`relative overflow-hidden rounded-xl border border-ink/10 flex-shrink-0 ${
                    layout.id === 'single-1' ? 'w-full aspect-[536/500]' :
                    layout.id === 'classic-3' ? 'w-full aspect-[536/440]' :
                    layout.id === 'strip-4' ? 'w-full aspect-[536/430]' :
                    'w-[calc(50%-8px)] aspect-[252/260]'
                  }`}
                >
                  <img src={p.dataUrl} className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} alt={`p-${i}`} />
                </div>
              ))}
              
              {/* DOM Overlay Texts */}
              {texts.map(t => (
                <div 
                  key={t.id} 
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap cursor-move select-none"
                  style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.color, fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`, textShadow: selectedFrame.bgColor === '#FFFFFF' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                  onPointerDown={(e) => handlePointerDown(e, t.id, 'text')}
                >
                  {t.text}
                </div>
              ))}

              {/* DOM Overlay Stickers */}
              {placedStickers.map(s => (
                <div
                  key={s.id}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-move leading-none select-none"
                  style={{ 
                    left: `${s.x}%`, 
                    top: `${s.y}%`, 
                    fontSize: `${32 * s.scale}px`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg)` 
                  }}
                  onPointerDown={(e) => handlePointerDown(e, s.id, 'sticker')}
                >
                  {s.emoji}
                </div>
              ))}
            </div>

            {customImage && (
              <img 
                src={customImage} 
                className="absolute bottom-[2%] left-[4%] w-[20%] aspect-square object-contain z-40 pointer-events-none rounded-lg p-0.5 border border-ink/10 shadow-sm bg-white/80" 
                alt="Custom overlay" 
              />
            )}
            <div className="absolute bottom-[1.5%] left-0 w-full text-center text-[7px] font-display font-bold tracking-[0.2em] pointer-events-none" style={{ color: selectedFrame.textColor }}>
              CTRL+Snap
            </div>
          </div>
        </div>

        {/* Kanan: Editor Tools (6 col) */}
        <div className="cream-card flex flex-col overflow-hidden rounded-[2.5rem] lg:col-span-6">
          {/* Tabs */}
          <div className="flex border-b border-ink/10">
            {[
              { id: 'filter', icon: ImageIcon, label: 'Filter Warna' },
              { id: 'sticker', icon: Smile, label: 'Stiker Lucu' },
              { id: 'text', icon: Type, label: 'Tambah Teks' },
              { id: 'frame', icon: Palette, label: 'Frame Warna' },
              { id: 'custom', icon: Crown, label: 'Mascot (Pro)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-black transition-colors ${activeTab === tab.id ? 'bg-muted-blue/50 text-ink border-b-2 border-ink' : 'text-soft-ink hover:bg-white/35 hover:text-ink'}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Filter Tab */}
            {activeTab === 'filter' && (
              <div className="grid grid-cols-3 gap-4">
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${selectedFilter.id === filter.id ? 'border-ink bg-muted-blue/50' : 'border-ink/10 bg-white/35 hover:border-ink/30'}`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted-blue">
                       <img src={photos[0]?.dataUrl} className={`w-full h-full object-cover ${filter.className}`} alt="preview" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold truncate w-full">{filter.name}</div>
                      <div className="mt-1 text-[10px] text-soft-ink">{filter.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sticker Tab */}
            {activeTab === 'sticker' && (
              <div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-8">
                  {STICKERS.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => handleAddSticker(sticker)}
                      className="flex aspect-square items-center justify-center rounded-2xl bg-white/40 text-3xl transition-all hover:scale-105 hover:bg-muted-blue/40"
                    >
                      {sticker.emoji}
                    </button>
                  ))}
                </div>
                
                {placedStickers.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="mb-2 text-sm font-black uppercase text-soft-ink">Layer Stiker</h4>
                    {placedStickers.map((s, idx) => (
                      <div key={s.id} className="flex flex-col gap-3 rounded-2xl bg-white/40 p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl">{s.emoji}</span>
                          <button onClick={() => setPlacedStickers(prev => prev.filter(item => item.id !== s.id))} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Scale</label>
                            <input type="range" min="0.5" max="3" step="0.1" value={s.scale} onChange={(e) => {
                              const newS = [...placedStickers]; newS[idx].scale = Number(e.target.value); setPlacedStickers(newS);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Rotation</label>
                            <input type="range" min="-180" max="180" value={s.rotation} onChange={(e) => {
                              const newS = [...placedStickers]; newS[idx].rotation = Number(e.target.value); setPlacedStickers(newS);
                            }} className="w-full accent-brand-via" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Text Tab */}
            {activeTab === 'text' && (
              <div>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Tulis sesuatu..."
                    className="flex-1 rounded-2xl border border-ink/10 bg-white/55 px-4 py-3 font-sans focus:border-ink focus:outline-none"
                  />
                  <button onClick={handleAddText} disabled={!inputText.trim()} className="rounded-2xl bg-ink px-6 font-black text-warm-cream disabled:opacity-50">
                    Tambah
                  </button>
                </div>
                
                {texts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="mb-2 text-sm font-black uppercase text-soft-ink">Layer Teks</h4>
                    {texts.map((t, idx) => (
                      <div key={t.id} className="flex flex-col gap-3 rounded-2xl bg-white/40 p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold truncate" style={{ color: t.color }}>{t.text}</span>
                          <button onClick={() => setTexts(prev => prev.filter(item => item.id !== t.id))} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[10px] text-gray-500 uppercase">Size</label>
                            <input type="range" min="8" max="48" value={t.fontSize} onChange={(e) => {
                              const newT = [...texts]; newT[idx].fontSize = Number(e.target.value); setTexts(newT);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[10px] text-gray-500 uppercase">Font</label>
                            <select 
                              value={t.fontFamily}
                              onChange={(e) => {
                                const newT = [...texts]; newT[idx].fontFamily = e.target.value; setTexts(newT);
                              }}
                              className="mt-1 w-full cursor-pointer appearance-none rounded-lg border border-ink/10 bg-white/55 px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none"
                              style={{ fontFamily: t.fontFamily }}
                            >
                              <option value="Outfit" style={{ fontFamily: 'Outfit' }}>Outfit (Modern)</option>
                              <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
                              <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                              <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                              <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
                              <option value="Impact" style={{ fontFamily: 'Impact' }}>Impact</option>
                              <option value="'Comic Sans MS', cursive" style={{ fontFamily: "'Comic Sans MS', cursive" }}>Comic Sans</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase">Color</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {['#FFFFFF', '#0F172A', '#8B5CF6', '#00E5FF', '#DB2777', '#F87171', '#FBBF24', '#34D399'].map(c => (
                                <button key={c} onClick={() => {
                                  const newT = [...texts]; newT[idx].color = c; setTexts(newT);
                                }} className={`w-6 h-6 rounded-full border-2 transition-all ${t.color === c ? 'border-brand-via scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                              ))}
                              {/* Native color picker */}
                              <label className={`w-6 h-6 rounded-full overflow-hidden border-2 cursor-pointer relative transition-all ${!['#FFFFFF', '#0F172A', '#8B5CF6', '#00E5FF', '#DB2777', '#F87171', '#FBBF24', '#34D399'].includes(t.color) ? 'border-brand-via scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 rounded-full" />
                                <input type="color" value={t.color} onChange={(e) => {
                                  const newT = [...texts]; newT[idx].color = e.target.value; setTexts(newT);
                                }} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Frame Tab */}
            {activeTab === 'frame' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h4 className="mb-3 text-[10px] font-black uppercase text-soft-ink tracking-wider">Frame Standar</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {FRAMES.map(frame => (
                      <button
                        key={frame.id}
                        onClick={() => {
                          setSelectedFrame(frame);
                          setCustomFrameBgImage(null);
                        }}
                        className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${selectedFrame.id === frame.id && !customFrameBgImage ? 'border-ink bg-muted-blue/50 shadow-md' : 'border-ink/10 bg-white/35 hover:border-ink/30'}`}
                      >
                        <div className="w-8 h-8 rounded-full shadow-inner border border-white/20 flex-shrink-0" style={{ backgroundColor: frame.bgColor }} />
                        <div className="flex-1 truncate">
                          <div className="text-sm font-bold truncate">{frame.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {sessionMode === 'premium' ? (
                  <div className="border-t border-ink/10 pt-5 space-y-4">
                    <h4 className="flex items-center gap-1.5 text-xs font-black uppercase text-ink tracking-wider">
                      <Crown className="w-4 h-4 text-ink animate-pulse" /> Kustomisasi Frame Premium
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Custom BG Color */}
                      <div className="cream-card rounded-2xl p-4 border border-ink/5 bg-white/40">
                        <label className="text-[10px] font-bold text-soft-ink uppercase tracking-wider block mb-2">Warna Background</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={selectedFrame.bgColor} 
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-ink/10 bg-transparent"
                          />
                          <span className="font-mono text-xs font-bold text-ink">{selectedFrame.bgColor.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Custom Text Color */}
                      <div className="cream-card rounded-2xl p-4 border border-ink/5 bg-white/40">
                        <label className="text-[10px] font-bold text-soft-ink uppercase tracking-wider block mb-2">Warna Teks & Watermark</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={selectedFrame.textColor} 
                            onChange={(e) => handleCustomTextColorChange(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-ink/10 bg-transparent"
                          />
                          <span className="font-mono text-xs font-bold text-ink">{selectedFrame.textColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Background Image */}
                    <div className="cream-card rounded-2xl p-5 border border-ink/5 bg-white/40">
                      <label className="text-[10px] font-bold text-soft-ink uppercase tracking-wider block mb-3">Template Gambar Background</label>
                      {!customFrameBgImage ? (
                        <div className="flex flex-col items-center justify-center border border-dashed border-ink/20 rounded-xl p-4 bg-white/30">
                          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-black text-warm-cream transition hover:scale-102 cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5" /> Pilih File Gambar
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setCustomFrameBgImage(e.target?.result as string);
                                    setSelectedFrame(prev => ({ ...prev, id: 'custom-frame', name: 'Custom Frame (Image)' }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          <p className="text-[10px] text-soft-ink mt-2 text-center">Gunakan file 600x1600 px untuk hasil strip terbaik.</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white/50 p-3">
                          <div className="flex items-center gap-3">
                            <img src={customFrameBgImage} className="w-10 h-14 object-cover rounded border border-ink/10" alt="custom frame preview" />
                            <div>
                              <div className="text-xs font-bold text-ink">Template Kustom</div>
                              <div className="text-[10px] text-soft-ink">Aktif sebagai background</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setCustomFrameBgImage(null)} 
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleOpenPremium}
                    className="cream-card rounded-[1.5rem] p-5 border border-dashed border-ink/20 flex flex-col items-center text-center cursor-pointer hover:bg-muted-blue/20 transition-colors group"
                  >
                    <Crown className="mb-2 h-6 w-6 text-soft-ink group-hover:text-ink transition-colors" />
                    <p className="text-xs font-black text-ink">Upgrade Kustomisasi Frame</p>
                    <p className="mt-1 text-[10px] text-soft-ink max-w-xs">Klik untuk upgrade ke Premium — ganti warna background & gunakan template gambar sendiri.</p>
                    <span className="mt-3 rounded-full bg-ink px-4 py-1.5 text-[10px] font-black text-warm-cream">Rp 10.000 / sesi →</span>
                  </div>
                )}
              </div>
            )}

            {/* Custom Mascot Tab */}
            {activeTab === 'custom' && (
              <div>
                <h4 className="mb-4 text-sm font-black uppercase text-soft-ink">Mascot / Custom Logo</h4>
                {sessionMode !== 'premium' ? (
                  <div
                    onClick={handleOpenPremium}
                    className="flex flex-col items-center justify-center rounded-2xl border border-ink/10 bg-white/40 p-8 text-center cursor-pointer hover:bg-muted-blue/20 transition-colors group"
                  >
                    <Crown className="mb-3 h-12 w-12 text-soft-ink group-hover:text-ink transition-colors" />
                    <p className="text-sm font-black text-ink">Fitur Premium</p>
                    <p className="mt-2 max-w-xs text-xs text-soft-ink">Klik untuk upgrade ke Premium — tambahkan logo, karakter, atau gambar kustom di pojok photostrip.</p>
                    <span className="mt-4 rounded-full bg-ink px-5 py-2 text-xs font-black text-warm-cream">Rp 10.000 / sesi →</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-white/40 p-6">
                    {!customImage ? (
                      <>
                        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-black text-warm-cream transition">
                          <ImageIcon className="w-4 h-4" /> Pilih Gambar
                          <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                               const reader = new FileReader();
                               reader.onload = (e) => setCustomImage(e.target?.result as string);
                               reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        <p className="text-xs text-gray-400 mt-4 text-center max-w-[200px]">Gunakan file PNG transparan untuk hasil terbaik.</p>
                      </>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <img src={customImage} className="w-24 h-24 object-contain bg-black/50 rounded-lg p-2 mb-4" alt="Custom Logo" />
                        <button onClick={() => setCustomImage(null)} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1 bg-red-400/10 px-4 py-2 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" /> Hapus Gambar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* ─── QRIS Premium Modal ─── */}
      {showPremiumModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isPremiumPaying && !isPremiumPaid) setShowPremiumModal(false); }}
        >
          <div className="relative w-full max-w-sm rounded-[2.5rem] bg-ink p-8 text-warm-cream shadow-2xl overflow-hidden">
            {!isPremiumPaid && !isPremiumPaying && (
              <button
                onClick={() => { setShowPremiumModal(false); setPremiumShowPayment(false); }}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-warm-cream/10 transition hover:bg-warm-cream/20"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Step 1: Upsell */}
            {!premiumShowPayment && !isPremiumPaid && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warm-cream/10">
                  <Crown className="w-7 h-7" />
                </div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-blue mb-1">Upgrade Premium</p>
                <h2 className="font-display text-2xl font-black leading-tight mb-2">Buka Semua Fitur</h2>
                <p className="text-sm text-warm-cream/70 mb-5 leading-relaxed">
                  Frame kustom, upload mascot/logo, bebas watermark — sekali bayar untuk sesi ini.
                </p>
                <div className="w-full mb-5 rounded-2xl bg-warm-cream/5 p-4 flex flex-col gap-2.5">
                  {['Kustomisasi warna & gambar frame', 'Upload mascot / logo kustom', 'Hasil foto bebas watermark'].map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-warm-cream/80">
                      <Check className="w-4 h-4 text-muted-blue flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-warm-cream/60">Harga per sesi</span>
                    <span className="font-mono text-2xl font-black">Rp 10.000</span>
                  </div>
                  <button
                    onClick={() => setPremiumShowPayment(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-warm-cream py-3.5 font-black text-ink hover:bg-warm-cream/90 transition"
                  >
                    <Crown className="w-4 h-4" /> Bayar & Upgrade Sekarang
                  </button>
                  <button onClick={() => setShowPremiumModal(false)} className="text-sm text-warm-cream/40 hover:text-warm-cream/70 transition py-1">
                    Nanti aja
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: QRIS Payment */}
            {premiumShowPayment && !isPremiumPaid && (
              <div className="flex flex-col items-center text-center">
                {!isPremiumPaying && (
                  <button
                    onClick={() => setPremiumShowPayment(false)}
                    className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-warm-cream/10 transition hover:bg-warm-cream/20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-1 mt-1">
                  <Sparkles className="w-4 h-4 text-muted-blue animate-pulse" />
                  <span className="font-display font-black text-lg tracking-widest">QRIS DINAMIS</span>
                </div>
                <p className="text-[10px] text-warm-cream/50 uppercase tracking-wider font-mono mb-4">CTRL+Snap Premium</p>
                <div className="w-full rounded-2xl border border-warm-cream/10 p-3 mb-4 flex justify-between items-center">
                  <span className="text-sm text-warm-cream/60">Total bayar</span>
                  <span className="font-mono text-xl font-black">Rp 10.000</span>
                </div>
                <div className="relative mb-4 flex aspect-square w-full max-w-[200px] items-center justify-center rounded-3xl bg-white p-3 shadow-inner">
                  {premiumQrisUrl
                    ? <img src={premiumQrisUrl} alt="QRIS" className="w-full h-full object-contain rounded-2xl" />
                    : <Loader2 className="w-8 h-8 animate-spin text-soft-ink" />}
                </div>
                <p className="text-xs text-warm-cream/50 mb-4">Scan dengan GOPAY, OVO, DANA, LinkAja, atau M-Banking.</p>
                <button
                  onClick={handleVerifyPremium}
                  disabled={isPremiumPaying}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-warm-cream py-3.5 font-black text-ink hover:bg-warm-cream/90 transition disabled:opacity-60"
                >
                  {isPremiumPaying ? <><Loader2 className="w-5 h-5 animate-spin" /> Lagi Dicek...</> : 'Udah Transfer, Gas! 🔥'}
                </button>
              </div>
            )}

            {/* Step 3: Success */}
            {isPremiumPaid && (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm-cream text-ink shadow-lg">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black">Premium Aktif! 🎉</h3>
                <p className="text-warm-cream/70 text-sm max-w-xs">Semua fitur premium sekarang terbuka. Silakan lanjutkan mendekorasi fotomu!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoEditor;

