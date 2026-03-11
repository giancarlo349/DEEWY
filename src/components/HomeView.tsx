import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Camera, Briefcase, Heart, ArrowRight, X, Maximize2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { PortfolioData } from '../types';

export default function HomeView() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('negocios');

  useEffect(() => {
    const portfolioRef = ref(db, 'public_portfolio');
    
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // If data is a collection of portfolios (keyed by UID), take the first one
        if (data.categories) {
          setPortfolio(data);
        } else {
          const firstUid = Object.keys(data)[0];
          if (firstUid && data[firstUid]) {
            setPortfolio(data[firstUid]);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar portfólio:", error);
      setLoading(false);
    });

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark grain">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white font-black text-xl tracking-[1em] uppercase"
        >
          Deewy
        </motion.div>
      </div>
    );
  }

  const categories = [
    { id: 'negocios', name: 'Negócios', icon: <Briefcase size={16} /> },
    { id: 'impacto', name: 'Impacto Social', icon: <Heart size={16} /> },
    { id: 'cotidiano', name: 'Cotidiano', icon: <Camera size={16} /> },
  ];

  const activePhotos = portfolio?.categories?.[activeCategory as keyof PortfolioData['categories']] || [];

  return (
    <div className="min-h-screen bg-dark text-white grain selection:bg-primary selection:text-white font-sans">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-8 flex justify-between items-center mix-blend-difference">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-white text-dark flex items-center justify-center font-black text-xl rounded-full shadow-xl">D</div>
          <span className="font-black tracking-tighter uppercase text-xl leading-none">Deewy</span>
        </motion.div>
        
        <nav className="flex items-center gap-6 md:gap-12">
          <div className="hidden md:flex items-center gap-12">
            {['Portfólio', 'Contato'].map((item, i) => (
              <motion.a
                key={item}
                href={item === 'Portfólio' ? '#portfolio' : '#contact'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={(e) => {
                  e.preventDefault();
                  const id = item === 'Portfólio' ? 'portfolio' : 'contact';
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState("", document.title, window.location.pathname + window.location.search);
                }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-white transition-all group-hover:w-full" />
              </motion.a>
            ))}
          </div>
          <motion.a 
            href="https://instagram.com/deewy.png" 
            target="_blank"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-dark transition-all"
          >
            <Instagram size={16} />
          </motion.a>
        </nav>
      </header>

      {/* Hero Section - Editorial Style */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax/Zoom */}
        <motion.div 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://res.cloudinary.com/drguum0vj/image/upload/v1773189755/TRUEDATRUE_1.1.2_eszhv8.jpg"
            alt="Giancarlo Eduardo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/20 to-dark" />
        </motion.div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <span className="inline-block text-xs md:text-sm font-black uppercase tracking-[0.6em] text-primary mb-6">
                  Visual Artist & Photographer
                </span>
                <h1 className="text-7xl sm:text-8xl md:text-[12vw] lg:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] mb-8 editorial-title">
                  DEEWY<span className="text-primary">.</span>
                </h1>
              </motion.div>
            </div>
            
            <div className="lg:col-span-4 lg:pb-12">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="space-y-8"
              >
                <p className="text-xl md:text-2xl text-white/60 font-serif italic leading-relaxed">
                  "Fotografia virando sentimento, sempre foi assim."
                </p>
                <div className="flex items-center gap-6">
                  <div className="h-px w-12 bg-white/20" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                    Giancarlo Eduardo
                  </span>
                </div>
                <button 
                  onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] hover:text-primary transition-colors"
                >
                  Ver Portfólio
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-primary group-hover:translate-x-2 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Vertical Rail Text */}
        <div className="absolute right-12 bottom-32 hidden xl:block">
          <span className="vertical-text text-[9px] font-black uppercase tracking-[0.8em] text-white/10">
            EST. 2026 • CURADORIA VISUAL • REGISTRO PROFISSIONAL
          </span>
        </div>
      </section>

      {/* Portfolio Section - Bento Style Grid */}
      <section id="portfolio" className="relative z-10 py-40 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
            <div className="max-w-2xl">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 mb-6 block"
              >
                Trabalhos Selecionados
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none"
              >
                Obras <span className="font-serif italic font-light lowercase text-white/20">e</span> Registros
              </motion.h2>
            </div>
            
            <nav className="flex overflow-x-auto no-scrollbar pb-2 md:pb-0 flex-nowrap md:flex-wrap gap-4 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat.id 
                      ? 'bg-white text-dark shadow-2xl' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-12 gap-4 md:gap-8 grid-flow-dense"
              >
                {activePhotos.length > 0 ? (
                  activePhotos.map((url, pIdx) => {
                    const isLarge = pIdx % 7 === 0;
                    const isTall = pIdx % 7 === 2 || pIdx % 7 === 5;
                    const isWide = pIdx % 7 === 4;

                    return (
                      <motion.div
                        key={pIdx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: pIdx * 0.1 }}
                        viewport={{ once: true }}
                        onClick={() => setSelectedPhoto(url)}
                        className={`
                          group relative overflow-hidden cursor-pointer rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-700
                          ${isLarge ? 'col-span-12 md:col-span-8 row-span-2 aspect-video md:aspect-auto' : 
                            isTall ? 'col-span-6 md:col-span-4 row-span-2 aspect-[3/5]' :
                            isWide ? 'col-span-12 md:col-span-8 aspect-video' :
                            'col-span-6 md:col-span-4 aspect-[3/4]'}
                        `}
                      >
                        <img 
                          src={url} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white" size={32} />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-40 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 text-white/20 mb-8">
                      <ImageIcon size={32} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-widest mb-4">Galeria em Preparação</h4>
                    <p className="text-white/30 font-serif italic text-lg">Novos registros serão adicionados em breve.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer - Minimal Luxury */}
      <footer id="contact" className="relative z-10 py-40 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
                LET'S <br />
                CREATE<span className="text-primary">.</span>
              </h2>
              <p className="text-lg md:text-xl text-white/40 font-serif italic max-w-md">
                Disponível para projetos comerciais, editoriais e colaborações criativas.
              </p>
            </div>
            
            <div className="flex flex-col gap-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Email</span>
                  <p className="text-lg font-medium">deewy.productions@gmail.com</p>
                </div>
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Social</span>
                  <a href="https://instagram.com/deewy.png" target="_blank" className="text-lg font-medium block hover:text-primary transition-colors">@deewy.png</a>
                </div>
              </div>
              
              <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.6em]">
                  © 2026 Deewy • Todos os direitos reservados
                </p>
                <div className="flex gap-8">
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white transition-colors">Voltar ao topo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-16"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-10 right-10 w-16 h-16 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all">
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedPhoto} 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
