import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Instagram, Camera, Heart, ArrowRight, X, Star, Briefcase, ChevronRight, MapPin, Calendar, Play, ArrowDown } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { PortfolioData } from '../types';

const LOGO_ONLY = "https://res.cloudinary.com/drguum0vj/image/upload/v1773269132/Deewy-04_bhpbnj.png";
const LOGO_WITH_NAME = "https://res.cloudinary.com/drguum0vj/image/upload/v1773268302/Deewy_zpnbng.png";

export default function HomeView() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const heroScale = useTransform(smoothProgress, [0, 0.3], [1, 1.2]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const marqueeX = useTransform(smoothProgress, [0, 1], [0, -500]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const portfolioRef = ref(db, 'public_portfolio');
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const firstUserUid = Object.keys(data)[0];
        if (firstUserUid) {
          setPortfolio(data[firstUserUid]);
        }
      }
      setTimeout(() => setLoading(false), 1500);
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) {
        setMousePos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      unsubscribe();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const allImages = portfolio?.urls ? portfolio.urls.map((url, idx) => ({
    url,
    category: 'Portfólio',
    title: `Obra ${idx + 1}`
  })) : (portfolio?.categories ? [
    ...(portfolio.categories?.negocios?.urls || []).map(url => ({ 
      url, 
      category: portfolio.categories?.negocios?.name || 'Negócios', 
      title: portfolio.categories?.negocios?.title || 'Editorial Corporativo' 
    })),
    ...(portfolio.categories?.impacto?.urls || []).map(url => ({ 
      url, 
      category: portfolio.categories?.impacto?.name || 'Impacto Social', 
      title: portfolio.categories?.impacto?.title || 'Conexão Humana' 
    })),
    ...(portfolio.categories?.cotidiano?.urls || []).map(url => ({ 
      url, 
      category: portfolio.categories?.cotidiano?.name || 'Cotidiano', 
      title: portfolio.categories?.cotidiano?.title || 'Vida Autêntica' 
    })),
  ] : []);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[10000] bg-bg flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0 bg-mesh"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.img 
            src={LOGO_ONLY} 
            alt="Deewy" 
            className="h-16 md:h-20 object-contain mb-12"
            animate={{ 
              opacity: [0.2, 1, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col items-center gap-6">
            <div className="h-[1px] w-32 bg-white/10 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="micro-label tracking-[0.8em] !text-white/20 text-[9px]">Carregando Visão</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative bg-bg text-white ${!isMobile ? 'grain' : ''} selection:bg-primary selection:text-white font-sans overflow-x-hidden`}
    >
      {/* Immersive Cursor Glow - Disabled on Mobile */}
      {!isMobile && (
        <motion.div 
          className="fixed w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0"
          animate={{ 
            x: mousePos.x * 200, 
            y: mousePos.y * 200,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-16 py-6 md:py-8 flex justify-between items-center mix-blend-difference">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
          <img src={LOGO_ONLY} alt="Deewy" className="h-8 md:h-12 object-contain" />
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4 md:gap-12"
        >
          <div className="flex items-center gap-4 md:gap-10 micro-label !text-white/60">
            <button onClick={scrollToPortfolio} className="hover:text-primary transition-colors cursor-pointer hidden sm:block">Portfólio</button>
            <button onClick={scrollToContact} className="hover:text-primary transition-colors cursor-pointer">Contato</button>
          </div>
          <a 
            href="https://instagram.com/deewy.png" 
            target="_blank" 
            rel="noreferrer"
            className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-bg transition-all duration-500"
          >
            <Instagram size={16} className="md:w-[18px] md:h-[18px]" />
          </a>
        </motion.div>
      </nav>

      {/* Extravagant Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-bg">
        {/* Abstract Background Effects - Simplified on Mobile */}
        <div className="absolute inset-0 z-0">
          {!isMobile && (
            <>
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  x: mousePos.x * 50,
                  y: mousePos.y * 50
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"
              />
              <motion.div 
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                  x: mousePos.x * -50,
                  y: mousePos.y * -50
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"
              />
            </>
          )}
          
          {/* Geometric Accents - Reduced on Mobile */}
          <div className="absolute inset-0 opacity-10 md:opacity-20">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            {!isMobile && (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] border border-white/5 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] border border-white/5 rounded-full border-dashed"
                />
              </>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-[20%] left-[10%] opacity-5 md:opacity-10"
          >
            <Camera size={80} className="text-white md:w-[120px] md:h-[120px]" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-[20%] right-[10%] opacity-5 md:opacity-10"
          >
            <Star size={60} className="text-primary md:w-[100px] md:h-[100px]" />
          </motion.div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 md:space-y-10 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <img 
                src={LOGO_WITH_NAME} 
                alt="Deewy" 
                className="h-16 md:h-32 lg:h-40 object-contain brightness-200 drop-shadow-[0_0_30px_rgba(255,77,109,0.3)]"
              />
            </motion.div>

            <div className="space-y-4 md:space-y-6">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="micro-label text-primary tracking-[0.5em] block mb-4"
              >
                Bem-vindo à galeria DEEWY!
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="editorial-title text-4xl sm:text-5xl md:text-7xl lg:text-8xl uppercase leading-[1.1]"
              >
                {portfolio?.heroTitle || "O OLHAR QUE TRANSFORMA O COMUM."}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm md:text-xl text-white/50 max-w-xl mx-auto font-light leading-relaxed uppercase tracking-widest"
              >
                {portfolio?.heroSubtitle || "Narrativas visuais que transcendem o tempo."}
              </motion.p>
            </div>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={scrollToPortfolio}
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Explorar Portfólio</span>
            </motion.button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-[-10vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
          >
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-10 border border-white/20 rounded-full flex justify-center p-1"
            >
              <motion.div 
                animate={{ y: [0, 16, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1 h-2 bg-primary rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section - Simplified on Mobile */}
      <div className="py-12 md:py-20 bg-white/[0.02] border-y border-white/5 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={!isMobile ? { x: ["0%", "-50%"] } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={`flex gap-10 md:gap-20 items-center pr-10 md:pr-20 ${isMobile ? 'overflow-x-auto no-scrollbar' : ''}`}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-10 md:gap-20 items-center">
                <span className="editorial-title text-5xl md:text-9xl text-stroke uppercase">Portfólio</span>
                <Star className="text-primary w-6 h-6 md:w-10 md:h-10" />
                <span className="editorial-title text-5xl md:text-9xl uppercase">Narrativa Visual</span>
                <Camera className="text-white/20 w-6 h-6 md:w-10 md:h-10" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <main className="relative z-10">
        {/* Section: Portfolio */}
        <section id="portfolio" className="py-20 md:py-40">
          <div className="max-w-7xl mx-auto px-6 md:px-16 space-y-16 md:space-y-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 md:gap-12 text-center md:text-left items-center md:items-end">
              <div className="space-y-4 md:space-y-6 flex flex-col items-center md:items-start">
                <span className="micro-label text-primary">Trabalhos Selecionados</span>
                <h2 className="editorial-title text-6xl sm:text-8xl md:text-[10rem] leading-[0.9]">A <br/> <span className="italic text-primary">COLEÇÃO.</span></h2>
              </div>
              <div className="flex flex-col items-center md:items-end gap-6">
                <p className="text-white/40 max-w-xs md:text-right font-light leading-relaxed text-sm md:text-base">
                  Uma seleção curada de nossas narrativas visuais mais impactantes em diferentes setores.
                </p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center hover:bg-white hover:text-bg transition-all cursor-pointer">
                    <ChevronRight className="rotate-180" size={18} />
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center hover:bg-white hover:text-bg transition-all cursor-pointer">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {allImages.length > 0 ? allImages.map((img, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  onClick={() => setSelectedPhoto(img.url)}
                  className="group cursor-pointer space-y-6 md:space-y-8"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-white/5">
                    <img 
                      src={img.url} 
                      alt={img.title} 
                      className={`w-full h-full object-cover ${!isMobile ? 'grayscale group-hover:grayscale-0' : ''} transition-all duration-1000 group-hover:scale-110`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-bg/60 opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center ${!isMobile ? 'backdrop-blur-md' : ''}`}>
                      <motion.div 
                        initial={!isMobile ? { scale: 0.8, opacity: 0 } : { opacity: 1 }}
                        whileHover={!isMobile ? { scale: 1, opacity: 1 } : {}}
                        className="w-16 h-16 md:w-24 md:h-24 glass rounded-full flex items-center justify-center"
                      >
                        <span className="micro-label !text-white">Ver</span>
                      </motion.div>
                    </div>
                    <div className="absolute top-4 left-4 md:top-8 md:left-8">
                      <div className="glass px-4 py-1 md:px-6 md:py-2 rounded-full backdrop-blur-xl border-white/10">
                        <span className="micro-label !text-white !text-[8px] md:text-[9px]">{img.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 md:px-6 flex justify-between items-end">
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-xl md:text-3xl font-serif italic leading-none">{img.title}</h3>
                      <div className="flex items-center gap-3 text-white/20">
                        <div className="w-6 md:w-8 h-px bg-white/10" />
                        <span className="micro-label !text-[8px] md:text-[9px]">Série 0{idx + 1}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-40 md:py-60 text-center border border-dashed border-white/5 rounded-[2rem] md:rounded-[4rem]">
                  <p className="text-white/10 micro-label tracking-[0.5em] md:tracking-[1em]">Aguardando Novos Registros</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section: Studio Philosophy */}
        <section id="sobre" className="relative py-32 md:py-60 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-primary/10 blur-[200px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-40 items-center relative z-10">
            <div className="space-y-10 md:space-y-16 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="space-y-4 md:space-y-8 flex flex-col items-center lg:items-start">
                <span className="micro-label text-primary">Nossa Visão</span>
                <h2 className="editorial-title text-6xl md:text-9xl uppercase leading-[0.9]">
                  {portfolio?.philosophyTitle || "O IMPACTO."}
                </h2>
              </div>
              <p className="text-lg md:text-2xl text-white/40 leading-relaxed font-light font-serif italic max-w-xl">
                "{portfolio?.philosophyText || "A Deewy acredita que toda marca e evento deve ser registrado em sua essência. Nossa missão é elevar a essência do seu negócio a um patamar de arte autêntica e atemporal."}"
              </p>
            </div>

            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative z-10 aspect-[4/5] rounded-[2rem] md:rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl"
              >
                <img 
                  src="https://res.cloudinary.com/drguum0vj/image/upload/v1773189755/TRUEDATRUE_1.1.2_eszhv8.jpg" 
                  className="w-full h-full object-cover object-left grayscale"
                  alt="Filosofia Estética"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section: Connect */}
        <section id="contato" className="py-32 md:py-60 bg-white/[0.01] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          
          <div className="max-w-7xl mx-auto px-6 md:px-16 text-center space-y-16 md:space-y-24 relative z-10">
            <div className="space-y-6 md:space-y-8">
              <span className="micro-label text-primary">Inicie um Legado</span>
              <h2 className="editorial-title text-6xl md:text-[12rem] lowercase leading-none">
                VAMOS <br/> <span className="italic text-primary">CRIAR.</span>
              </h2>
            </div>
            
            <div className="flex flex-col items-center gap-10 md:gap-16">
              <a 
                href="mailto:deewy.productions@gmail.com" 
                className="group relative inline-block"
              >
                <span className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-serif italic group-hover:text-primary transition-all duration-500 break-all">
                  deewy.productions@gmail.com
                </span>
                <motion.div 
                  className="absolute -bottom-2 md:-bottom-4 left-0 h-[1px] md:h-[2px] bg-primary"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                />
              </a>
              
              <div className="flex gap-8 md:gap-12">
                <a href="https://instagram.com/deewy.png" target="_blank" rel="noreferrer" className="micro-label hover:text-primary transition-colors">Instagram</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-16 py-12 md:py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-end gap-10 md:gap-12">
            <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-start">
              <img src={LOGO_WITH_NAME} alt="Deewy" className="h-8 md:h-10 opacity-40" />
              <div className="space-y-2 text-center md:text-left">
                <p className="micro-label !text-white/20">© 2026 DEEWY STUDIO • TODOS OS DIREITOS RESERVADOS</p>
                <p className="micro-label !text-white/10">CRIADO COM ALMA NO BRASIL</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
              <div className="flex flex-wrap justify-center gap-6 md:gap-12 micro-label !text-white/40">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Início</button>
                <a href="#portfolio" className="hover:text-white transition-colors">Portfólio</a>
                <button onClick={scrollToContact} className="hover:text-white transition-colors cursor-pointer">Contato</button>
              </div>
              <div className="w-20 h-px bg-white/10 hidden md:block" />
            </div>
          </div>
        </footer>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[10001] bg-bg/98 ${!isMobile ? 'backdrop-blur-3xl' : ''} flex items-center justify-center p-6 md:p-20`}
              onClick={() => setSelectedPhoto(null)}
            >
              <button className="absolute top-6 right-6 md:top-10 md:right-10 text-white/20 hover:text-white transition-colors">
                <X size={isMobile ? 32 : 48} />
              </button>
              <motion.img 
                initial={!isMobile ? { scale: 0.9, y: 50 } : { opacity: 0 }}
                animate={!isMobile ? { scale: 1, y: 0 } : { opacity: 1 }}
                src={selectedPhoto} 
                className="max-w-full max-h-full object-contain rounded-[2rem] md:rounded-[4rem] border border-white/10 shadow-[0_80px_160px_rgba(0,0,0,0.9)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
