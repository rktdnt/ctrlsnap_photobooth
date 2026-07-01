import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, LayoutTemplate, Zap, Download, Star, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TESTIMONIALS } from '../types';

interface LandingPageProps {
  onNext: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNext }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="font-display font-bold text-xl tracking-wider text-white">PHOTOMATICS</h1>
              <p className="text-[10px] text-neon-cyan tracking-widest uppercase font-mono">Photobooth </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <button onClick={onNext} className="hover:text-white transition-colors cursor-pointer">Templates</button>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
            <a href="#ulasan" className="hover:text-white transition-colors">Ulasan</a>
          </nav>
          <button 
            onClick={onNext}
            className="shimmer-btn px-6 py-2.5 rounded-full font-semibold text-sm hidden md:block"
          >
            Mulai Foto
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel w-fit border-neon-purple/30 text-neon-purple text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Photobooth Gen Z</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Capture Moments. <br />
              <span className="text-gradient-neon">Create Memories.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Ubah webcam Anda menjadi studio photobooth estetik dengan filter instan, stiker lucu, dan frame kustom. Hasil bisa langsung diunduh ke HP lewat QR Code!
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <button onClick={onNext} className="shimmer-btn px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 group">
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Mulai Foto Sekarang
              </button>
              <button onClick={onNext} className="px-8 py-4 rounded-full font-bold text-lg glass-panel hover:bg-white/5 transition-colors cursor-pointer">
                Lihat Template
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[600px] hidden lg:block"
          >
            {/* Mockup Floating Strips */}
            <div className="absolute top-10 right-10 w-[180px] animate-float" style={{ animationDelay: '0s' }}>
              <div className="bg-white p-4 pb-12 rounded-lg shadow-2xl transform rotate-6 border border-gray-200">
                <div className="flex flex-col gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-[4/3] bg-gray-200 rounded overflow-hidden relative">
                      <img src={`https://i.pinimg.com/736x/93/a1/28/93a1281aa2f9d6de6c266c3a38ed2795.jpg`} className="w-full h-full object-cover filter contrast-125" alt="sample" />
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center text-xs font-bold text-gray-800 tracking-widest">
                  PHOTOMATICS
                </div>
              </div>
            </div>

            <div className="absolute top-32 right-48 w-[180px] animate-float" style={{ animationDelay: '-3s' }}>
              <div className="bg-bg-card p-4 pb-12 rounded-lg shadow-2xl transform -rotate-12 border border-neon-cyan/50 shadow-neon-cyan/20">
                <div className="flex flex-col gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-[4/3] bg-gray-800 rounded overflow-hidden relative">
                      <img src={`https://i.pinimg.com/736x/34/0b/4c/340b4c4c738cd79ab93b2503504e8ebd.jpg`} className="w-full h-full object-cover filter saturate-150 hue-rotate-[180deg]" alt="sample" />
                      <div className="absolute inset-0 bg-neon-cyan/20 mix-blend-overlay"></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center text-xs font-bold text-neon-cyan tracking-widest font-mono">
                  TOKYO GLITCH
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fitur Section */}
      <section id="fitur" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Fitur <span className="text-gradient">Unggulan</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Semua yang Anda butuhkan untuk membuat photostrip sempurna langsung dari browser.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Real-time Filter", desc: "Lihat efek warna langsung saat foto, bukan setelah jepret." },
              { icon: LayoutTemplate, title: "Template Kustom", desc: "Pilih layout grid atau strip klasik dengan berbagai warna frame." },
              { icon: Zap, title: "Stiker & Teks Editor", desc: "Tambahkan emoji, stiker, dan tulisan dengan mudah." },
              { icon: Download, title: "HD Export & QR", desc: "Unduh file resolusi tinggi atau scan QR untuk simpan di HP." },
              { icon: Camera, title: "Timer Otomatis", desc: "Berpose tanpa repot klik berkat timer cerdas terintegrasi." },
              { icon: Star, title: "Riwayat Sesi", desc: "Akses kembali foto-foto lama Anda di perangkat yang sama." }
            ].map((f, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-brand-start/20 flex items-center justify-center text-brand-start mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Mockup */}
      <section id="demo" className="py-24 bg-black/40">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-12">Coba <span className="text-gradient-neon">Langsung</span></h2>
          <div className="max-w-4xl mx-auto glass-panel rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-brand-start/20">
            {/* Window Header */}
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="mx-auto text-xs font-mono text-gray-500">photomatics.app</div>
            </div>
            {/* Window Content */}
            <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10">
                  <img src="https://i.pinimg.com/736x/9b/1d/b0/9b1db04363f741a301d54d935db737ed.jpg" className="w-full h-full object-cover opacity-60" alt="demo" />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono border border-white/10">
                    🔴 PHOTO
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={onNext} className="w-20 h-20 bg-red-500 rounded-full border-4 border-white/20 flex items-center justify-center hover:scale-105 hover:bg-red-600 transition-all shadow-lg shadow-red-500/50 cursor-pointer">
                      <div className="w-16 h-16 rounded-full border-2 border-white/50 bg-red-500/50 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "100K+", label: "Photos Created" },
              { num: "50+", label: "Templates & Frames" },
              { num: "4.9/5", label: "User Rating" },
              { num: "24/7", label: "Always Available" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                  {stat.num}
                </div>
                <div className="text-sm text-brand-via uppercase tracking-widest font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="ulasan" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-16">Kata <span className="text-gradient">Mereka</span></h2>
          
          <div className="relative min-h-[250px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center"
              >
                <div className="flex gap-1 text-yellow-400 mb-6">
                  {[...Array(TESTIMONIALS[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-2xl md:text-3xl font-display font-medium text-gray-200 leading-snug mb-8">
                  "{TESTIMONIALS[activeTestimonial].comment}"
                </p>
                <div className="flex items-center gap-4">
                  <img src={TESTIMONIALS[activeTestimonial].avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-brand-via" />
                  <div className="text-left">
                    <div className="font-bold">{TESTIMONIALS[activeTestimonial].name}</div>
                    <div className="text-sm text-gray-400">{TESTIMONIALS[activeTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-3 mt-12">
            {TESTIMONIALS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-brand-via' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-black/40">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Pilih <span className="text-gradient-neon">Sesi Anda</span></h2>
            <p className="text-gray-400">Pilih paket yang sesuai untuk mengabadikan momen spesial Anda.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Trial */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5">
              <h3 className="text-2xl font-bold mb-2">Trial Sesi</h3>
              <div className="text-4xl font-display font-bold mb-6">Rp 0</div>
              <ul className="flex flex-col gap-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-brand-via" /> 1x Jepretan (Single Frame)</li>
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-brand-via" /> Filter Dasar (Normal)</li>
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-brand-via" /> Stiker Terbatas</li>
                <li className="flex items-center gap-3 opacity-50"><ChevronRight className="w-5 h-5" /> Ada Watermark</li>
              </ul>
              <button onClick={onNext} className="w-full py-3 rounded-full border border-white/20 hover:bg-white/5 font-bold transition-colors">
                Coba Gratis
              </button>
            </div>
            
            {/* Premium */}
            <div className="glass-panel p-8 rounded-3xl border border-neon-cyan/50 relative transform md:scale-105 shadow-2xl shadow-neon-cyan/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-start to-neon-cyan px-4 py-1 rounded-full text-xs font-bold tracking-widest">
                REKOMENDASI
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium Sesi</h3>
              <div className="text-4xl font-display font-bold mb-6 text-neon-cyan">Rp 10.000 <span className="text-sm font-sans text-gray-400 font-normal">/sesi</span></div>
              <ul className="flex flex-col gap-4 mb-8 text-gray-300">
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-neon-cyan" /> Semua Layout (up to 4 frames)</li>
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-neon-cyan" /> Semua Filter & Frame Eksklusif</li>
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-neon-cyan" /> Bebas Watermark</li>
                <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-neon-cyan" /> QR Code Download Kualitas HD</li>
              </ul>
              <button onClick={onNext} className="w-full py-3 rounded-full shimmer-btn font-bold text-white shadow-lg shadow-brand-via/30">
                Mulai Sesi Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="font-display font-bold text-2xl tracking-wider text-white mb-2">PHOTOMATICS</h2>
            <p className="text-gray-500 text-sm">Dibuat dengan cinta dan segelas kopi</p>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Bantuan</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-white transition-colors">Privasi</a>
          </div>
        </div>
        <div className="text-center text-gray-600 text-xs mt-12">
          &copy; {new Date().getFullYear()} Photomatics. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
