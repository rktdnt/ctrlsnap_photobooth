import React, { useEffect, useState } from 'react';
import { Camera, ChevronRight, Download, LayoutTemplate, Play, Sparkles, Star, Timer, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TESTIMONIALS } from '../types';

interface LandingPageProps {
  onNext: () => void;
}

const FeatureCard = ({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) => (
  <div className="cream-card rounded-[2rem] p-7">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted-blue text-ink">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mb-2 text-xl font-black">{title}</h3>
    <p className="text-sm leading-6 text-soft-ink">{desc}</p>
  </div>
);

const MiniStrip = ({ 
  className = '', 
  dark = false, 
  images = [] 
}: { 
  className?: string; 
  dark?: boolean; 
  images?: string[];
}) => (
  <div className={`rounded-[1.4rem] p-4 pb-10 shadow-2xl ${dark ? 'bg-ink text-warm-cream' : 'bg-warm-cream text-ink'} ${className}`}>
    <div className="flex flex-col gap-3">
      {images.map((imgSrc, index) => (
        <div key={index} className="aspect-[4/3] rounded-xl overflow-hidden bg-muted-blue">
          <img 
            src={imgSrc} 
            alt={`Photostrip frame ${index + 1}`} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
        </div>
      ))}
    </div>
    <div className="mt-5 text-center text-[10px] font-black tracking-[0.28em]">PHOTOMATICS</div>
  </div>
);

const PREVIEW_IMAGES = [
  '/images/strip_one_one.png',
  '/images/strip_one_two.png',
  '/images/strip_one_three.png',
];

const getPhotoNumber = (path: string): string => {
  const lowercasePath = path.toLowerCase();
  if (lowercasePath.includes('one') || lowercasePath.includes('_1')) return '1';
  if (lowercasePath.includes('two') || lowercasePath.includes('_2')) return '2';
  if (lowercasePath.includes('three') || lowercasePath.includes('_3')) return '3';
  if (lowercasePath.includes('four') || lowercasePath.includes('_4')) return '4';
  if (lowercasePath.includes('five') || lowercasePath.includes('_5')) return '5';
  if (lowercasePath.includes('six') || lowercasePath.includes('_6')) return '6';
  
  const match = path.match(/\d+/);
  return match ? match[0] : '1';
};

const LandingPage: React.FC<LandingPageProps> = ({ onNext }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % PREVIEW_IMAGES.length);
    }, 800); // 800ms interval for stop-motion photobooth look
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full pb-16">
      <header className="sticky top-0 z-50 px-4 py-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[2rem] bg-warm-cream/90 px-6 shadow-lg shadow-ink/5 backdrop-blur-xl">
          <button onClick={onNext} className="text-left">
            <h1 className="font-display text-2xl font-black tracking-tight text-ink">Photomatics</h1>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-soft-ink">Soft photobox</p>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-extrabold text-soft-ink md:flex">
            <a href="#fitur" className="hover:text-ink">Fitur</a>
            <button onClick={onNext} className="hover:text-ink">Template</button>
            <a href="#demo" className="hover:text-ink">Live Demo</a>
            <a href="#ulasan" className="hover:text-ink">Ulasan</a>
          </nav>
          <button onClick={onNext} className="soft-btn-primary rounded-full px-6 py-3 text-sm font-black">
            Mulai Foto
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-warm-cream px-4 py-2 text-sm font-extrabold text-soft-ink shadow-sm">
              <Sparkles className="h-4 w-4" />
              Photobox santai, hasil tetap niat
            </div>
            <h2 className="max-w-3xl font-display text-6xl font-black leading-[0.94] text-ink md:text-8xl">
              Capture moments, simpan jadi cerita.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-soft-ink">
              Website photobox dengan alur cepat: pilih sesi, ambil foto, hias photostrip, lalu unduh atau bagikan. Nuansanya calm, clean, dan tetap menarik dilihat.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <button onClick={onNext} className="soft-btn-primary flex items-center gap-3 rounded-full px-8 py-4 text-base font-black">
                <Camera className="h-5 w-5" />
                Mulai Foto Sekarang
              </button>
              <a href="#demo" className="soft-btn-secondary rounded-full px-8 py-4 text-base font-black">
                Lihat Preview
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.12 }} className="relative min-h-[620px]">
            <div className="absolute inset-0 rounded-[3rem] bg-muted-blue/55" />
            <div className="absolute left-8 top-10 h-28 w-28 rounded-full bg-warm-cream" />
            <div className="absolute bottom-12 right-12 h-36 w-36 rounded-full bg-cloud-white" />
            <MiniStrip 
              className="animate-float absolute right-12 top-12 w-52 rotate-6 z-10" 
              images={[
                '/images/strip_one_one.png',
                '/images/strip_one_two.png',
                '/images/strip_one_three.png'
              ]}
            />
            <MiniStrip 
              className="animate-float absolute left-20 top-36 w-60 -rotate-6 z-20" 
              dark 
              images={[
                '/images/strip_two_one.png',
                '/images/strip_two_two.png',
                '/images/strip_two_three.png'
              ]}
            />
          </motion.div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">Fitur utama</p>
              <h2 className="font-display text-5xl font-black">Dibuat untuk photostrip yang gampang dipakai.</h2>
            </div>
            <p className="max-w-md text-soft-ink">Alurnya tetap familiar seperti photobooth, tapi visualnya lebih lembut dan modern.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Sparkles} title="Filter real-time" desc="Pilih mood warna saat sesi kamera berjalan, lalu lanjutkan ke editor." />
            <FeatureCard icon={LayoutTemplate} title="Layout photostrip" desc="Trial bisa single frame, premium membuka strip dan grid yang lebih lengkap." />
            <FeatureCard icon={Wand2} title="Editor dekorasi" desc="Tambahkan filter, stiker, teks, dan frame sebelum export." />
            <FeatureCard icon={Download} title="Export HD" desc="Hasil akhir siap diunduh, dikirim, atau dibagikan lewat QR/tautan." />
            <FeatureCard icon={Timer} title="Timer otomatis" desc="3, 5, atau 10 detik untuk pose yang lebih santai." />
            <FeatureCard icon={Star} title="Riwayat sesi" desc="Hasil lama tetap bisa dilihat lagi di perangkat yang sama." />
          </div>
        </section>

        <section id="demo" className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="cream-card rounded-[2.5rem] p-10">
              <p className="eyebrow mb-3">Live preview</p>
              <h2 className="font-display text-5xl font-black">Coba langsung dari browser.</h2>
              <p className="mt-5 text-soft-ink">Tanpa install aplikasi tambahan. Kamera aktif, timer jalan, lalu hasil langsung masuk editor.</p>
              <button onClick={onNext} className="soft-btn-primary mt-8 flex items-center gap-3 rounded-full px-7 py-4 font-black">
                <Play className="h-5 w-5" />
                Buka Photobox
              </button>
            </div>
            <div className="rounded-[2.5rem] bg-ink p-5 text-warm-cream shadow-2xl shadow-ink/20">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-warm-cream" />
                <span className="h-3 w-3 rounded-full bg-muted-blue" />
                <span className="h-3 w-3 rounded-full bg-cloud-white" />
                <span className="ml-auto font-mono text-xs text-warm-cream/55">photomatics.app</span>
              </div>
              <div 
                className="flex aspect-video items-center justify-center rounded-[2rem] bg-muted-blue bg-cover bg-center relative overflow-hidden group cursor-pointer"
                style={{ backgroundImage: `url(${PREVIEW_IMAGES[previewIndex]})` }}
                onClick={onNext}
              >
                <div className="absolute inset-0 bg-ink/20 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all duration-300" />
                
                <div className="absolute inset-4 border border-warm-cream/20 rounded-[1.5rem] pointer-events-none flex flex-col justify-between p-3 select-none">
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-warm-cream/70 font-bold">
                    <span>00:0{getPhotoNumber(PREVIEW_IMAGES[previewIndex])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ulasan" className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="eyebrow mb-3">Kata mereka</p>
          <h2 className="font-display text-5xl font-black">Mood-nya simple, hasilnya tetap memorable.</h2>
          <div className="relative mt-12 min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="cream-card absolute inset-0 rounded-[2.5rem] p-10"
              >
                <div className="mb-5 flex justify-center gap-1 text-ink">
                  {[...Array(TESTIMONIALS[activeTestimonial].rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                </div>
                <p className="mx-auto max-w-3xl text-2xl font-black leading-snug">"{TESTIMONIALS[activeTestimonial].comment}"</p>
                <p className="mt-6 font-bold text-soft-ink">{TESTIMONIALS[activeTestimonial].name} · {TESTIMONIALS[activeTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-2 rounded-full transition-all ${i === activeTestimonial ? 'w-9 bg-ink' : 'w-2 bg-muted-blue'}`} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="cream-card rounded-[2.5rem] p-9">
              <p className="eyebrow mb-4">Trial Sesi</p>
              <h3 className="font-display text-5xl font-black">Rp 0</h3>
              <p className="mt-5 text-soft-ink">Cocok untuk coba cepat: single frame, filter dasar, dan watermark.</p>
              <button onClick={onNext} className="soft-btn-secondary mt-8 w-full rounded-full py-4 font-black">Coba Gratis</button>
            </div>
            <div className="rounded-[2.5rem] bg-ink p-9 text-warm-cream shadow-2xl shadow-ink/20">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-blue">Premium Sesi</p>
              <h3 className="mt-4 font-display text-5xl font-black">Rp 10.000</h3>
              <p className="mt-5 text-warm-cream/75">Semua layout, frame eksklusif, bebas watermark, dan QR download kualitas HD.</p>
              <button onClick={onNext} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-warm-cream py-4 font-black text-ink">
                Mulai Premium <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
