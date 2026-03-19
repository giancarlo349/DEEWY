import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Instagram, Sparkles, Camera, ChevronLeft, ChevronRight, ArrowUpRight, X, Mail, ArrowDown, Quote } from 'lucide-react';
import { PhotoEvent } from '../types';

interface ProjectCarouselProps {
  photos: string[];
  primaryColor: string;
}

const ProjectGallery = ({ photos, name, customText }: { photos: string[], name: string, customText?: string }) => null;

function PortfolioContent({ events }: { events: PhotoEvent[] }) {
  const [showPopup, setShowPopup] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroActive(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isIntroActive) {
      const timer = setTimeout(() => {
        const hasSeenPopup = localStorage.getItem('hasSeenInstaPopup');
        if (!hasSeenPopup) setShowPopup(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isIntroActive]);

  const handleClosePopup = () => {
    setShowPopup(false);
    localStorage.setItem('hasSeenInstaPopup', 'true');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white grain overflow-x-hidden">
      <AnimatePresence>
        {isIntroActive && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center p-6"
          >
            <div className="relative max-w-md w-full">
              {/* Newspaper "Stamp" Animation */}
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="border-4 border-primary p-8 text-center bg-black/40 backdrop-blur-sm"
              >
                <img 
                  src="https://res.cloudinary.com/drguum0vj/image/upload/v1773268302/Deewy_zpnbng.png" 
                  alt="DEEWY" 
                  className="w-full h-auto mb-4 invert brightness-0 saturate-100 invert-[15%] sepia(95%) saturate(6932%) hue-rotate(354deg) brightness(91%) contrast(124%)"
                  style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(354deg) brightness(91%) contrast(124%)' }}
                />
                <div className="h-px bg-primary w-full mb-4" />
                <p className="text-primary font-black uppercase tracking-[0.5em] text-xs">
                  Edição Especial • 2024
                </p>
              </motion.div>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.6 }}
                className="h-px bg-white/20 mt-8"
              />
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="text-white/40 text-[10px] uppercase tracking-widest mt-4 text-center"
              >
                Imprimindo Memórias...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newspaper Header (Masthead) */}
      <header className="sticky top-0 z-[60] bg-dark/95 backdrop-blur-md border-b-4 border-white">
        {/* News Ticker */}
        <div className="bg-primary text-white py-1 overflow-hidden whitespace-nowrap border-b border-black">
          <motion.div
            animate={{ x: [0, -500] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="text-[8px] font-black uppercase tracking-[0.4em] inline-block"
          >
            ÚLTIMAS NOTÍCIAS: DEEWY LANÇA NOVA EDIÇÃO DIGITAL • REGISTRO VISUAL EM ALTA DEFINIÇÃO • SÃO PAULO RECEBE EXPOSIÇÃO EXCLUSIVA • 
          </motion.div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col items-center">
          <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">
            <span>Vol. 01 • No. 04</span>
            <span className="hidden md:block">São Paulo, Brasil</span>
            <div className="flex gap-4">
              <span>PREÇO: VALOR INESTIMÁVEL</span>
              <span>Março 2024</span>
            </div>
          </div>
          
          <div className="h-px bg-white/20 w-full mb-4" />
          
          <div className="flex items-center justify-center py-1 md:py-2">
            <img 
              src="https://res.cloudinary.com/drguum0vj/image/upload/v1773268302/Deewy_zpnbng.png" 
              alt="DEEWY" 
              className="h-10 md:h-20 w-auto invert"
            />
          </div>

          <div className="h-px bg-white/20 w-full mt-4 mb-2" />
          
          <nav className="w-full flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.4em]">
            <a href="#projetos" className="hover:text-primary transition-colors">Portfólio</a>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>
        </div>
      </header>

      {/* Portfolio Grid Section */}
      <section id="projetos" className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12">
          <div className="border-b-2 border-white/10 pb-6 md:pb-8">
            <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
              Arquivo <span className="text-primary italic font-serif lowercase tracking-normal">Visual</span>
            </h2>
            <p className="text-white/60 text-xs md:text-lg font-medium tracking-[0.2em] uppercase max-w-2xl leading-relaxed">
              Explorando a interseção entre o design moderno e a fotografia clássica de eventos.
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
            {events.flatMap(event => event.photoUrls).map((photo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 4) * 0.05 }}
                className="break-inside-avoid mb-4 md:mb-6 group relative overflow-hidden bg-zinc-900 rounded-sm"
              >
                <img 
                  src={photo} 
                  alt={`Portfolio ${idx}`}
                  className="w-full h-auto grayscale group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Registro No. {idx + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Footer */}
      <footer id="contato" className="py-20 md:py-40 px-6 bg-dark border-t-8 border-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <div className="md:col-span-6 space-y-8">
              <h4 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8]">
                Vamos criar <br /> <span className="text-primary italic font-serif lowercase tracking-normal">história?</span>
              </h4>
              <p className="text-white/40 text-sm md:text-xl max-w-xl font-body">
                Acompanhe nossa jornada visual e receba atualizações sobre novos projetos e insights de registro.
              </p>
              
              <div className="flex flex-col gap-4 pt-8">
                <button 
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                  className="w-fit px-12 py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs hover:scale-105 transition-all shadow-[0_0_50px_rgba(240,5,45,0.3)]"
                >
                  Solicitar Edição
                </button>
              </div>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-12 pt-12 md:pt-0">
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Redação</span>
                <div className="flex flex-col gap-4">
                  <a href="#" className="text-sm font-bold uppercase tracking-tighter hover:text-primary transition-colors">Instagram</a>
                  <a href="#" className="text-sm font-bold uppercase tracking-tighter hover:text-primary transition-colors">Behance</a>
                  <a href="#" className="text-sm font-bold uppercase tracking-tighter hover:text-primary transition-colors">LinkedIn</a>
                </div>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Correspondência</span>
                <div className="flex flex-col gap-4">
                  <a href="mailto:contato@deewy.com" className="text-sm font-bold uppercase tracking-tighter hover:text-primary transition-colors">contato@deewy.com</a>
                  <span className="text-sm font-bold uppercase tracking-tighter">São Paulo, BR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-40 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <img 
              src="https://res.cloudinary.com/drguum0vj/image/upload/v1773268302/Deewy_zpnbng.png" 
              alt="DEEWY" 
              className="h-12 w-auto invert opacity-20"
            />
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
              © 2024 DEEWY VISUAL RECORDER • TODOS OS DIREITOS RESERVADOS
            </div>
          </div>
        </div>
      </footer>

      {/* Instagram Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePopup}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[3rem] p-12 border border-white/10 shadow-[0_0_100px_rgba(240,5,45,0.2)] overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/20 blur-[100px] rounded-full" />
              
              <button onClick={handleClosePopup} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                <X size={28} />
              </button>
              
              <div className="relative z-10 space-y-10 text-center">
                <div className="w-24 h-24 mx-auto rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 overflow-hidden border-4 border-white/10">
                  <img 
                    src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267528/Deewy-05_kn9ukp.jpg" 
                    className="w-full h-full object-cover" 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="text-primary text-[10px] font-black uppercase tracking-[0.5em]">Junte-se a nós</div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">Acompanhe nossa <br /> jornada visual</h3>
                  <p className="text-white/50 text-base leading-relaxed max-w-xs mx-auto">
                    Siga a <span className="text-white font-bold">@deew.png</span> e faça parte da nossa comunidade editorial.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { window.open('https://www.instagram.com/deew.png', '_blank'); handleClosePopup(); }}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                  >
                    Seguir no Instagram <Instagram size={18} />
                  </button>
                  <button 
                    onClick={handleClosePopup}
                    className="w-full py-5 bg-white/5 text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white transition-all"
                  >
                    Talvez depois
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        img { -webkit-user-select: none; user-select: none; -webkit-user-drag: none; user-drag: none; }
        .grain { position: relative; }
        .grain::after {
          content: "";
          position: fixed;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background-image: url("https://res.cloudinary.com/drguum0vj/image/upload/v1773267528/grain_texture.png");
          opacity: 0.03;
          pointer-events: none;
          z-index: 9999;
          animation: grain 8s steps(10) infinite;
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
      `}} />
    </div>
  );
}

export default function PublicPortfolio() {
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const publicEventsRef = ref(db, 'public_events');
    const unsubscribe = onValue(publicEventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            ...val
          }))
          .filter(event => event.isPublic)
          .sort((a, b) => b.createdAt - a.createdAt);
        setEvents(list);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(240,5,45,0.3)]"></div>
      </div>
    );
  }

  return <PortfolioContent events={events} />;
}
