import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Maximize2, X, ChevronLeft, ChevronRight, Grid, LayoutList, Share2, Camera, Sparkles, ArrowDown, Home } from 'lucide-react';
import { PhotoEvent } from '../types';

export default function ClientView({ code }: { code: string }) {
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

  useEffect(() => {
    const eventRef = ref(db, `public_events/${code}`);
    const unsubscribe = onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEvent(data);
      } else {
        setError('Galeria não encontrada ou código inválido.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [code]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'deewy-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const nextPhoto = () => {
    if (event && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % event.photoUrls.length);
    }
  };

  const prevPhoto = () => {
    if (event && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + event.photoUrls.length) % event.photoUrls.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark grain overflow-hidden">
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.div 
              animate={{ 
                letterSpacing: ['0.2em', '0.8em', '0.2em'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-white font-black text-8xl tracking-tighter"
            >
              DEEWY
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-[10px] font-bold tracking-[1em] uppercase text-white mt-4 ml-4"
            >
              Visual Registry
            </motion.div>
          </motion.div>
          
          {/* Passive background elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute -top-40 -left-40 w-80 h-80 border border-white/10 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute -bottom-40 -right-40 w-80 h-80 border border-white/10 rounded-full blur-3xl pointer-events-none"
          />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark p-6 text-center grain">
        <div className="w-24 h-24 bg-white/5 text-primary rounded-full flex items-center justify-center mb-8 border border-white/10">
          <X size={48} />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Acesso Negado</h1>
        <p className="text-white/40 max-w-md font-medium">{error}</p>
        <button 
          onClick={() => window.location.href = window.location.origin}
          className="mt-12 px-8 py-4 bg-white text-dark font-black uppercase tracking-widest text-xs rounded-full hover:bg-primary hover:text-white transition-all"
        >
          voltar ao HOME
        </button>
      </div>
    );
  }

  const primaryColor = event.primaryColor || '#E60023';
  const secondaryColor = event.secondaryColor || '#0A0A0A';

  return (
    <div className="min-h-screen bg-dark text-white selection:bg-white selection:text-dark grain overflow-x-hidden relative" style={{ '--primary': primaryColor } as any}>
      {/* Passive Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-[20%] -left-20 w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] -right-20 w-[30vw] h-[30vw] rounded-full bg-white/5 blur-[100px]"
        />
      </div>

      {/* Editorial Header */}
      <header className="relative h-screen flex flex-col justify-between p-8 md:p-16 overflow-hidden">
        {/* Background Image with Parallax-like feel */}
        <motion.div 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={event.photoUrls[0]} 
            className="w-full h-full object-cover opacity-50"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark/40 to-dark" />
        </motion.div>

        {/* Top Nav */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <motion.a 
              href="/"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
              title="Voltar para o Início"
            >
              <Home size={20} />
            </motion.a>
            <div className="flex flex-col">
              {event.logoUrl ? (
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="h-16 md:h-20"
              >
                <img src={event.logoUrl} alt={event.name} className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
              </motion.div>
            ) : (
              <>
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-4xl font-black tracking-tighter leading-none"
                >
                  DEEWY
                </motion.div>
                <motion.div 
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mt-1"
                >
                  Visual Registry
                </motion.div>
              </>
            )}
          </div>
        </div>
        <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="hidden md:block text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Código do Evento</div>
              <div className="text-sm font-mono font-bold" style={{ color: primaryColor }}>#{event.code}</div>
            </div>
            <button 
              onClick={() => {
                navigator.share({ title: `Deewy - ${event.name}`, url: window.location.href }).catch(() => {});
              }}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-dark transition-all"
            >
              <Share2 size={20} />
            </button>
          </motion.div>
        </div>

        {/* Hero Title */}
        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px w-20" style={{ backgroundColor: primaryColor }} />
                <span className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: primaryColor }}>Galeria Deewy</span>
              </div>
              <h1 className="text-7xl md:text-[12rem] font-black tracking-tighter uppercase leading-[0.8] mb-12">
                {event.name.split(' ').map((word, i) => (
                  <span key={i} className="block overflow-hidden">
                    <motion.span 
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.6 + (i * 0.1), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-end gap-8 pb-4"
          >
            <div className="vertical-text text-[10px] font-black uppercase tracking-[0.5em] text-white/20 h-32">
              Scroll to explore
            </div>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center"
            >
              <ArrowDown size={16} />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-t border-white/10 pt-8">
          <div className="max-w-md">
            <p className="text-lg font-medium text-white/60 leading-relaxed">
              {event.customText || 'Cada registro é uma cápsula do tempo. Explore sua galeria exclusiva e reviva seus melhores momentos.'}
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Total de Registros</div>
              <div className="text-4xl font-black">{event.photoUrls.length}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Data de Criação</div>
              <div className="text-4xl font-black">{new Date(event.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Section */}
      <section className="px-8 md:px-16 py-32 bg-dark">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-20">
          <h2 className="text-4xl font-black tracking-tighter uppercase">A <span style={{ color: primaryColor }}>Coleção</span></h2>
          <div className="flex items-center gap-4 p-2 bg-white/5 rounded-full border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-dark' : 'text-white/40 hover:text-white'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('masonry')}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'masonry' ? 'bg-white text-dark' : 'text-white/40 hover:text-white'}`}
            >
              Editorial
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className={`grid gap-4 md:gap-8 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-12'}`}>
          {event.photoUrls.map((url, index) => {
            const isEditorial = viewMode === 'masonry';
            const isLarge = isEditorial && index % 7 === 0;
            const isTall = isEditorial && (index % 7 === 2 || index % 7 === 5);
            const isWide = isEditorial && index % 7 === 4;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`
                  relative group overflow-hidden rounded-[2rem] bg-white/5 cursor-zoom-in
                  ${!isEditorial ? 'aspect-[3/4]' : 
                    isLarge ? 'col-span-12 md:col-span-8 row-span-2 aspect-video md:aspect-auto' : 
                    isTall ? 'col-span-6 md:col-span-4 row-span-2 aspect-[3/5]' :
                    isWide ? 'col-span-12 md:col-span-8 aspect-video' :
                    'col-span-6 md:col-span-4 aspect-[3/4]'}
                `}
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <img 
                  src={url} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt={`Registro ${index + 1}`}
                  loading="lazy"
                />
              
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-dark/60 backdrop-blur-md rounded-full border border-white/10">
                  <Camera size={10} className="text-primary md:w-3 md:h-3" />
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Captured by Deewy</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-widest">Registro #{index + 1}</div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(url, `deewy-${event.name}-${index}.jpg`);
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white text-dark rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl"
                  >
                    <Download size={16} className="md:w-4.5 md:h-4.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      </section>

      {/* Brand Section */}
      <section className="py-40 px-8 text-center bg-dark relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none"
        />
        <div className="relative z-10">
          <Camera className="mx-auto mb-12" size={48} style={{ color: primaryColor }} />
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-8 leading-[0.9] px-4">
            Momentos <br /> <span style={{ color: primaryColor }}>Eternizados</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto font-medium text-base md:text-lg mb-16 px-6">
            A Deewy acredita que cada clique é uma obra de arte. Obrigado por nos deixar fazer parte da sua história.
          </p>
          <div className="flex flex-col items-center">
            <div className="text-3xl md:text-4xl font-black tracking-tighter mb-2">DEEWY</div>
            <div className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/20">Registro Visual</div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/98 md:backdrop-blur-lg flex flex-col grain"
          >
            {/* Lightbox Header */}
            <div className="p-4 md:p-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="text-xl md:text-2xl font-black tracking-tighter">DEEWY</div>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {selectedPhotoIndex + 1} / {event.photoUrls.length}
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6">
                <button 
                  onClick={() => handleDownload(event.photoUrls[selectedPhotoIndex], `deewy-${event.name}-${selectedPhotoIndex}.jpg`)}
                  className="flex items-center gap-2 md:gap-3 bg-white text-dark px-4 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:bg-primary hover:text-white transition-all"
                >
                  <Download size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Download</span>
                </button>
                <button 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} className="md:w-8 md:h-8" />
                </button>
              </div>
            </div>

            {/* Lightbox Image */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
              <button 
                onClick={prevPhoto}
                className="absolute left-4 md:left-8 z-10 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <ChevronLeft size={32} className="md:w-12 md:h-12" />
              </button>
              
              <motion.img 
                key={selectedPhotoIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={event.photoUrls[selectedPhotoIndex]} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                alt=""
              />

              <button 
                onClick={nextPhoto}
                className="absolute right-4 md:right-8 z-10 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <ChevronRight size={32} className="md:w-12 md:h-12" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="p-4 md:p-8 overflow-x-auto flex justify-center gap-3 md:gap-4 no-scrollbar">
              {event.photoUrls.map((url, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedPhotoIndex(i)}
                  className={`w-12 h-16 md:w-16 md:h-20 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-500 ${selectedPhotoIndex === i ? 'border-primary scale-110 shadow-2xl shadow-primary/20' : 'border-transparent opacity-20 hover:opacity-50'}`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
