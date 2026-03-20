import { useState, useEffect, useRef, SyntheticEvent, UIEvent, useCallback } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, ChevronLeft, ChevronRight, Share2, Camera, ArrowDown, Home, Instagram, ExternalLink, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { PhotoEvent } from '../types';

export default function ClientView({ code }: { code: string }) {
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showInstaPopup, setShowInstaPopup] = useState(false);
  const [hasClosedPopup, setHasClosedPopup] = useState(false);
  const [visibleChunks, setVisibleChunks] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [focusedChunkIndex, setFocusedChunkIndex] = useState(0);

  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const CHUNK_SIZE = isMobile ? 2 : 5;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    }, (err) => {
      console.error(err);
      setError('Erro ao carregar galeria. Verifique sua conexão ou permissões.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [code]);

  // Show Instagram popup after 5 seconds if not closed before
  useEffect(() => {
    if (!loading && !error && !hasClosedPopup) {
      const timer = setTimeout(() => {
        setShowInstaPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, hasClosedPopup]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.85;
    const index = Math.round(scrollLeft / (itemWidth + 24));
    setActiveIndex(index);
  };

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

  const nextPhoto = useCallback(() => {
    if (!event || selectedPhotoIndex === null) return;
    const nextIndex = (selectedPhotoIndex + 1) % event.photoUrls.length;
    setSelectedPhotoIndex(nextIndex);
    setIsZoomed(false);
    
    const newChunkIndex = Math.floor(nextIndex / CHUNK_SIZE);
    setFocusedChunkIndex(newChunkIndex);

    // Auto-expand visible chunks if we navigate past them in lightbox
    const neededChunks = Math.ceil((nextIndex + 1) / CHUNK_SIZE);
    if (neededChunks > visibleChunks) {
      setVisibleChunks(neededChunks);
    }
  }, [event, selectedPhotoIndex, CHUNK_SIZE, visibleChunks]);

  const prevPhoto = useCallback(() => {
    if (!event || selectedPhotoIndex === null) return;
    const prevIndex = (selectedPhotoIndex - 1 + event.photoUrls.length) % event.photoUrls.length;
    setSelectedPhotoIndex(prevIndex);
    setIsZoomed(false);
    setFocusedChunkIndex(Math.floor(prevIndex / CHUNK_SIZE));
  }, [event, selectedPhotoIndex, CHUNK_SIZE]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, nextPhoto, prevPhoto]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <img 
            src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
            alt="Deewy" 
            className="h-24 w-auto object-contain mb-4 animate-pulse"
            referrerPolicy="no-referrer"
          />
          <div className="text-[10px] font-black tracking-[1em] uppercase text-white/20">Carregando</div>
        </motion.div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] p-6 text-center">
        <X size={48} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Ops!</h1>
        <p className="text-white/40 mb-8">{error}</p>
        <a href="/" className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full">Voltar</a>
      </div>
    );
  }

  const brandColor = '#f0052d';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      {/* Editorial Header */}
      <header className="relative h-[80vh] md:h-screen flex flex-col justify-between p-6 md:p-16 overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          <img src={event.photoUrls[0] || "https://res.cloudinary.com/drguum0vj/image/upload/v1773269132/Deewy-04_bhpbnj.png"} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
        </motion.div>

        <nav className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
              <Home size={20} />
            </a>
            <a 
              href="https://instagram.com/deewy.png" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all"
            >
              <Instagram size={16} className="text-primary" style={{ color: brandColor }} />
              <span className="micro-label !text-white/60">@deewy.png</span>
            </a>
          </div>
          <img 
            src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
            alt="Deewy" 
            className="h-8 md:h-12 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex items-center gap-3">
            {event.driveLink && (
              <a 
                href={event.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all"
              >
                <Download size={14} /> Baixar Tudo
              </a>
            )}
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event.name, url: window.location.href }).catch(() => {});
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard?.writeText(window.location.href).then(() => {
                    setShowCopyFeedback(true);
                    setTimeout(() => setShowCopyFeedback(false), 3000);
                  }).catch(() => {
                    // Silent fail or console log
                  });
                }
              }}
              className="flex items-center gap-2 px-4 md:px-6 h-12 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all relative"
            >
              <Share2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Compartilhar Galeria</span>
              
              <AnimatePresence>
                {showCopyFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl z-[100]"
                  >
                    Link Copiado!
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-primary" style={{ backgroundColor: brandColor }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary" style={{ color: brandColor }}>Bem-vindo à Galeria Deewy</span>
            </div>
            <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter uppercase leading-[0.85] mb-8 break-words">
              {event.name}
            </h1>
            <p className="text-white/60 max-w-lg text-sm md:text-lg font-medium leading-relaxed">
              {event.customText || 'Cada registro é uma cápsula do tempo. Explore sua galeria exclusiva e reviva seus melhores momentos.'}
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex justify-between items-end border-t border-white/5 pt-8">
          <div className="flex gap-8">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Registros</div>
              <div className="text-2xl font-black">{event.photoUrls.length}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Data</div>
              <div className="text-2xl font-black">{new Date(event.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
            </div>
          </div>
          {event.driveLink && (
            <a 
              href={event.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Download size={20} />
            </a>
          )}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center"
          >
            <ArrowDown size={16} className="text-white/40" />
          </motion.div>
        </div>
      </header>

      {/* Drive Link Section - Smart Design */}
      {event.driveLink && (
        <section className="px-6 md:px-16 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-primary/30 transition-all duration-500"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-2xl shadow-primary/10 group-hover:scale-110 transition-transform">
                <ExternalLink size={32} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1">Problemas ao carregar?</h3>
                <p className="text-white/40 text-sm font-medium">Acesse a pasta completa no Google Drive para baixar em alta resolução.</p>
              </div>
            </div>
            <a 
              href={event.driveLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary hover:text-white transition-all text-center"
            >
              Acessar Google Drive
            </a>
          </motion.div>
        </section>
      )}

      {/* Gallery Grid */}
      <section className="px-4 md:px-16 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles size={14} className="text-primary" style={{ color: brandColor }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sua Seleção</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">A <span className="text-primary" style={{ color: brandColor }}>Coleção</span></h2>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            {event.photoUrls.length} Registros Encontrados
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {event.photoUrls.slice(0, visibleChunks * CHUNK_SIZE).map((url, index) => {
            const chunkIndex = Math.floor(index / CHUNK_SIZE);
            const isFocused = chunkIndex === focusedChunkIndex;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "200px" }}
                transition={{ duration: 0.4 }}
                className={`relative group aspect-[3/4] overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-white/5 cursor-pointer border border-white/5 transition-all duration-500 ${
                  !isFocused ? 'opacity-20' : 'opacity-100'
                } ${!isMobile && !isFocused ? 'grayscale scale-95' : ''} ${!isMobile && isFocused ? 'grayscale-0 scale-100' : ''}`}
                onClick={() => {
                  setFocusedChunkIndex(chunkIndex);
                  setSelectedPhotoIndex(index);
                  setIsZoomed(false);
                }}
              >
                {/* Photo by Deewy Tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-white/60 border border-white/10">
                    Photo by Deewy
                  </span>
                </div>

                {/* Always Available Download Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(url, `deewy-${index}.jpg`);
                  }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  <Download size={14} />
                </button>

                <img 
                  src={url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt="" 
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">#{index + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More Button */}
        {visibleChunks * CHUNK_SIZE < event.photoUrls.length && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => {
                const nextChunk = visibleChunks;
                setVisibleChunks(prev => prev + 1);
                setFocusedChunkIndex(nextChunk);
              }}
              className="px-12 py-5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 group"
            >
              Carregar <span className="text-primary group-hover:text-black" style={{ color: brandColor }}>Mais {CHUNK_SIZE}</span>
            </button>
          </div>
        )}
      </section>

      {/* Footer Branding */}
      <footer className="py-24 md:py-40 px-6 text-center border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-8">
          <Camera className="text-primary" size={32} style={{ color: brandColor }} />
        </div>
        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-12 leading-none">
          Momentos <br /> <span className="text-primary" style={{ color: brandColor }}>Eternizados</span>
        </h2>
        <div className="space-y-6">
          <img 
            src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
            alt="Deewy" 
            className="h-8 md:h-12 mx-auto opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="flex justify-center gap-8">
            <a href="https://instagram.com/deewy.png" target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-colors">Instagram</a>
            <a href="/" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-colors">Portfolio</a>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white/10">Visual Registry &copy; 2026</p>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[1000] bg-black/98 ${!isMobile ? 'backdrop-blur-2xl' : ''} flex flex-col`}
          >
            {/* Lightbox Header */}
            <div className="p-4 md:p-8 flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1" style={{ color: brandColor }}>{event.name}</span>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Registro {selectedPhotoIndex + 1} de {event.photoUrls.length}
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                {!isMobile && (
                  <button 
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                    title={isZoomed ? "Reduzir" : "Zoom"}
                  >
                    {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => handleDownload(event.photoUrls[selectedPhotoIndex], `deewy-${selectedPhotoIndex}.jpg`)}
                  className="h-10 md:h-12 px-4 md:px-8 bg-white text-black rounded-full font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 hover:bg-primary hover:text-white transition-all"
                >
                  <Download size={14} /> <span className="hidden sm:inline">Download</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedPhotoIndex(null);
                    setIsZoomed(false);
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Viewer */}
            <div className="flex-1 relative flex items-center justify-center p-2 md:p-10 overflow-hidden">
              {CHUNK_SIZE > 1 && (
                <button 
                  onClick={prevPhoto}
                  className="absolute left-4 md:left-8 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <motion.div
                key={selectedPhotoIndex}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) prevPhoto();
                  else if (info.offset.x < -100) nextPhoto();
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`w-full h-full flex items-center justify-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => !isMobile && setIsZoomed(!isZoomed)}
              >
                <img 
                  src={event.photoUrls[selectedPhotoIndex]} 
                  className={`max-w-full max-h-full object-contain shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-lg md:rounded-2xl transition-transform duration-500 ${isZoomed ? 'scale-[1.8]' : 'scale-100'}`} 
                  alt=""
                />
              </motion.div>

              {CHUNK_SIZE > 1 && (
                <button 
                  onClick={nextPhoto}
                  className="absolute right-4 md:right-8 z-10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instagram Popup */}
      <AnimatePresence>
        {showInstaPopup && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowInstaPopup(false); setHasClosedPopup(true); }}
              className={`absolute inset-0 bg-black/60 ${!isMobile ? 'backdrop-blur-sm' : ''}`}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] p-0.5 mb-6">
                  <div className="w-full h-full bg-[#111111] rounded-[calc(1.5rem-2px)] flex items-center justify-center">
                    <Instagram size={40} className="text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Gostou dos registros?</h3>
                <p className="text-white/40 text-sm font-medium mb-8">Siga <span className="text-white font-bold">@deewy.png</span> no Instagram para acompanhar as novidades e bastidores.</p>
                
                <div className="w-full space-y-3">
                  <a 
                    href="https://instagram.com/deewy.png" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => { setShowInstaPopup(false); setHasClosedPopup(true); }}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary hover:text-white transition-all"
                  >
                    Seguir
                  </a>
                  <button 
                    onClick={() => { setShowInstaPopup(false); setHasClosedPopup(true); }}
                    className="w-full py-4 text-white/20 hover:text-white/40 font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Perder as novidades
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
