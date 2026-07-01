import React, { useState } from 'react';
import { CapturedPhoto, PhotostripLayout, PhotoFrame, PhotoFilter, Sticker, TextItem, PlacedSticker, FILTERS, STICKERS, FRAMES } from '../types';
import { ChevronLeft, Download, Type, Image as ImageIcon, Smile, Palette, Trash2 } from 'lucide-react';

interface Props {
  photos: CapturedPhoto[];
  layout: PhotostripLayout;
  initialFrame: PhotoFrame;
  onBack: () => void;
  onSave: (compiledDataUrl: string) => void;
}

const PhotoEditor: React.FC<Props> = ({ photos, layout, initialFrame, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'sticker' | 'text' | 'frame'>('filter');
  
  // Editor State
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>(FILTERS[0]);
  const [selectedFrame, setSelectedFrame] = useState<PhotoFrame>(initialFrame);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  
  // Text Input State
  const [inputText, setInputText] = useState('');
  
  // Compiler state
  const [isCompiling, setIsCompiling] = useState(false);
  
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

      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

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
        
        ctx.font = `bold ${t.fontSize * 1.5}px Outfit, sans-serif`; // upscale for high-res
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = t.color;
        
        if (selectedFrame.bgColor.toUpperCase() === '#FFFFFF') {
          ctx.shadowColor = 'rgba(0,0,0,0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        }
        
        ctx.fillText(t.text.toUpperCase(), px, py);
        ctx.restore();
      });

      // 6. Watermark Footer
      ctx.save();
      ctx.fillStyle = selectedFrame.textColor;
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('PHOTOMATICS AI BOOTH', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 24);
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
    <div className="container mx-auto px-6 py-8 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xs font-mono text-brand-via tracking-widest uppercase mb-1">LANGKAH 03 DARI 03</h2>
            <h1 className="text-2xl font-display font-bold">Hias & Kustomisasi Foto</h1>
          </div>
        </div>

        <button 
          onClick={compilePhotostrip}
          disabled={isCompiling}
          className="shimmer-btn px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2"
        >
          {isCompiling ? 'Memproses...' : (
            <><Download className="w-4 h-4" /> Simpan & Export</>
          )}
        </button>
      </div>

      <div className="flex-1 grid lg:grid-cols-12 gap-8">
        {/* Kiri: Live DOM Preview (6 col) */}
        <div className="lg:col-span-6 flex justify-center bg-black/20 rounded-3xl p-8 border border-white/5 overflow-y-auto max-h-[70vh]">
          <div 
            className="w-full max-w-[300px] relative shadow-2xl transition-colors duration-500 overflow-hidden"
            style={{ 
              backgroundColor: selectedFrame.bgColor,
              aspectRatio: layout.id === 'single-1' ? '1/1.13' : layout.id === 'grid-4' ? '1/1.2' : '1/2.6',
              padding: '16px'
            }}
          >
            {selectedFrame.pattern === 'radial-dot' && (
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: selectedFrame.textColor }} />
            )}

            <div className={`relative z-10 w-full h-full flex ${layout.id === 'grid-4' ? 'flex-wrap gap-2' : 'flex-col gap-2'}`}>
              {photos.map((p, i) => (
                <div 
                  key={i} 
                  className={`relative overflow-hidden border border-white/10 ${layout.id === 'grid-4' ? 'w-[calc(50%-4px)] aspect-square' : 'w-full aspect-[4/3]'}`}
                >
                  <img src={p.dataUrl} className={`w-full h-full object-cover transform -scale-x-100 ${selectedFilter.className}`} alt={`p-${i}`} />
                </div>
              ))}
              
              {/* DOM Overlay Texts */}
              {texts.map(t => (
                <div 
                  key={t.id} 
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 font-display font-bold uppercase whitespace-nowrap cursor-pointer"
                  style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.color, fontSize: `${t.fontSize}px`, textShadow: selectedFrame.bgColor === '#FFFFFF' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t.text}
                </div>
              ))}

              {/* DOM Overlay Stickers */}
              {placedStickers.map(s => (
                <div
                  key={s.id}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer leading-none"
                  style={{ 
                    left: `${s.x}%`, 
                    top: `${s.y}%`, 
                    fontSize: `${32 * s.scale}px`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg)` 
                  }}
                >
                  {s.emoji}
                </div>
              ))}
            </div>

            <div className="absolute bottom-3 left-0 w-full text-center text-[8px] font-display font-bold tracking-[0.2em]" style={{ color: selectedFrame.textColor }}>
              PHOTOMATICS AI BOOTH
            </div>
          </div>
        </div>

        {/* Kanan: Editor Tools (6 col) */}
        <div className="lg:col-span-6 glass-panel rounded-3xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'filter', icon: ImageIcon, label: 'Filter Warna' },
              { id: 'sticker', icon: Smile, label: 'Stiker Lucu' },
              { id: 'text', icon: Type, label: 'Tambah Teks' },
              { id: 'frame', icon: Palette, label: 'Frame Warna' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold transition-colors ${activeTab === tab.id ? 'bg-white/10 text-brand-via border-b-2 border-brand-via' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
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
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectedFilter.id === filter.id ? 'border-brand-via bg-brand-via/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="w-full aspect-square bg-gray-800 rounded-lg overflow-hidden">
                       <img src={photos[0]?.dataUrl} className={`w-full h-full object-cover ${filter.className}`} alt="preview" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold truncate w-full">{filter.name}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{filter.description}</div>
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
                      className="aspect-square glass-panel rounded-xl text-3xl flex items-center justify-center hover:scale-110 hover:bg-white/10 transition-all"
                    >
                      {sticker.emoji}
                    </button>
                  ))}
                </div>
                
                {placedStickers.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase">Layer Stiker</h4>
                    {placedStickers.map((s, idx) => (
                      <div key={s.id} className="bg-white/5 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl">{s.emoji}</span>
                          <button onClick={() => setPlacedStickers(prev => prev.filter(item => item.id !== s.id))} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">X Position</label>
                            <input type="range" min="5" max="95" value={s.x} onChange={(e) => {
                              const newS = [...placedStickers]; newS[idx].x = Number(e.target.value); setPlacedStickers(newS);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Y Position</label>
                            <input type="range" min="5" max="95" value={s.y} onChange={(e) => {
                              const newS = [...placedStickers]; newS[idx].y = Number(e.target.value); setPlacedStickers(newS);
                            }} className="w-full accent-brand-via" />
                          </div>
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-via font-sans"
                  />
                  <button onClick={handleAddText} disabled={!inputText.trim()} className="bg-brand-via px-6 rounded-xl font-bold hover:bg-brand-end disabled:opacity-50">
                    Tambah
                  </button>
                </div>
                
                {texts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase">Layer Teks</h4>
                    {texts.map((t, idx) => (
                      <div key={t.id} className="bg-white/5 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold truncate" style={{ color: t.color }}>{t.text}</span>
                          <button onClick={() => setTexts(prev => prev.filter(item => item.id !== t.id))} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">X Position</label>
                            <input type="range" min="2" max="98" value={t.x} onChange={(e) => {
                              const newT = [...texts]; newT[idx].x = Number(e.target.value); setTexts(newT);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Y Position</label>
                            <input type="range" min="2" max="98" value={t.y} onChange={(e) => {
                              const newT = [...texts]; newT[idx].y = Number(e.target.value); setTexts(newT);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Size</label>
                            <input type="range" min="8" max="48" value={t.fontSize} onChange={(e) => {
                              const newT = [...texts]; newT[idx].fontSize = Number(e.target.value); setTexts(newT);
                            }} className="w-full accent-brand-via" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Color</label>
                            <div className="flex gap-2 mt-1">
                              {['#FFFFFF', '#0F172A', '#8B5CF6', '#00E5FF', '#DB2777'].map(c => (
                                <button key={c} onClick={() => {
                                  const newT = [...texts]; newT[idx].color = c; setTexts(newT);
                                }} className={`w-6 h-6 rounded-full border-2 ${t.color === c ? 'border-brand-via scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                              ))}
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
              <div className="grid grid-cols-2 gap-4">
                {FRAMES.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${selectedFrame.id === frame.id ? 'border-brand-via bg-brand-via/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="w-10 h-10 rounded-full shadow-inner border border-white/20 flex-shrink-0" style={{ backgroundColor: frame.bgColor }} />
                    <div>
                      <div className="text-sm font-bold truncate">{frame.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
