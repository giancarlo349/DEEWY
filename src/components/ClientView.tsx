import { useState, useEffect, useRef, SyntheticEvent, WheelEvent, TouchEvent, UIEvent } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { Download, Maximize2, X, ChevronLeft, ChevronRight, Grid, LayoutList, Share2, Camera, Sparkles, ArrowDown, Home } from 'lucide-react';
import { PhotoEvent } from '../types';

export default function ClientView({ code }: { code: string }) {
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [zoomScale, setZoomScale] = useState(1);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxLoadedIndex, setMaxLoadedIndex] = useState(1);
  const itemsPerPage = 5; // Fixed for desktop

  // Sync maxLoadedIndex with current view
  useEffect(() => {
    const current = selectedPhotoIndex !== null ? selectedPhotoIndex : activeIndex;
    setMaxLoadedIndex(prev => Math.max(prev, current + 1));
  }, [selectedPhotoIndex, activeIndex]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.85;
    const index = Math.round(scrollLeft / (itemWidth + 24)); // 24 is gap-6
    setActiveIndex(index);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setZoomScale(1);
    x.set(0);
    y.set(0);
  }, [selectedPhotoIndex]);

  useEffect(() => {
    let newConstraints = { left: 0, right: 0, top: 0, bottom: 0 };

    if (zoomScale > 1 && constraintsRef.current) {
      const container = constraintsRef.current.getBoundingClientRect();
      const containerRatio = container.width / container.height;
      
      let renderedWidth, renderedHeight;
      
      if (imageAspectRatio > containerRatio) {
        renderedWidth = container.width;
        renderedHeight = container.width / imageAspectRatio;
      } else {
        renderedHeight = container.height;
        renderedWidth = container.height * imageAspectRatio;
      }

      const xOverflow = Math.max(0, (renderedWidth * zoomScale - container.width) / 2);
      const yOverflow = Math.max(0, (renderedHeight * zoomScale - container.height) / 2);
      
      newConstraints = {
        left: -xOverflow,
        right: xOverflow,
        top: -yOverflow,
        bottom: yOverflow
      };
    }

    setDragConstraints(newConstraints);

    // Progressive centering: pull the image back into bounds as zoom decreases
    const currentX = x.get();
    const currentY = y.get();
    
    const targetX = Math.max(newConstraints.left, Math.min(newConstraints.right, currentX));
    const targetY = Math.max(newConstraints.top, Math.min(newConstraints.bottom, currentY));
    
    if (targetX !== currentX) {
      animate(x, targetX, { type: "spring", stiffness: 300, damping: 30 });
    }
    if (targetY !== currentY) {
      animate(y, targetY, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [zoomScale, imageAspectRatio]);

  const resetZoom = () => setZoomScale(1);

  const toggleZoom = () => {
    setZoomScale(prev => prev === 1 ? 3 : 1);
  };

  const handleWheel = (e: WheelEvent) => {
    if (selectedPhotoIndex === null || isMobile) return;
    // Prevent background scroll
    if (e.cancelable) e.preventDefault();
    
    const delta = -e.deltaY;
    const factor = 0.001;
    setZoomScale(prev => {
      const next = prev + delta * factor;
      return Math.min(Math.max(next, 1), 5);
    });
  };

  useEffect(() => {
    const el = constraintsRef.current;
    if (!el) return;

    const onWheel = (e: globalThis.WheelEvent) => {
      if (selectedPhotoIndex !== null) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [selectedPhotoIndex]);

  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhotoIndex]);

  const handleTouchMove = (e: TouchEvent) => {
    if (isMobile) return;
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      
      if (lastTouchDistance.current !== null) {
        const delta = distance - lastTouchDistance.current;
        const factor = 0.01;
        setZoomScale(prev => {
          const next = prev + delta * factor;
          return Math.min(Math.max(next, 1), 5);
        });
      }
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
  };

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageAspectRatio(img.naturalWidth / img.naturalHeight);
  };

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
    if (!event || selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(prev => prev !== null ? (prev + 1) % event.photoUrls.length : null);
  };

  const prevPhoto = () => {
    if (!event || selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(prev => prev !== null ? (prev - 1 + event.photoUrls.length) % event.photoUrls.length : null);
  };

  const totalPages = event ? Math.ceil(event.photoUrls.length / itemsPerPage) : 0;
  const visiblePhotos = event ? event.photoUrls.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage) : [];

  const nextPage = () => {
    if (event && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (event && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Sync page when photo changes (e.g. via arrows in lightbox)
  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      const newPage = Math.floor(selectedPhotoIndex / itemsPerPage);
      // Only update currentPage if the new photo is on a different page
      // Use functional update to avoid stale closure issues with currentPage
      setCurrentPage(current => {
        if (newPage !== current) return newPage;
        return current;
      });
    }
  }, [selectedPhotoIndex, itemsPerPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
        if (e.key === 'Escape') setSelectedPhotoIndex(null);
      } else {
        if (e.key === 'ArrowRight') nextPage();
        if (e.key === 'ArrowLeft') prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, event, totalPages, currentPage]); // Include dependencies for correct closure values

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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-8"
            >
              <img 
                src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
                alt="Deewy" 
                className="h-24 md:h-32 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
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
            className="absolute -top-40 -left-40 w-80 h-80 border border-white/10 rounded-full pointer-events-none"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute -bottom-40 -right-40 w-80 h-80 border border-white/10 rounded-full pointer-events-none"
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

  const primaryColor = event.primaryColor || '#f0052d';
  const secondaryColor = event.secondaryColor || '#090005';

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
          className="absolute top-[20%] -left-20 w-[40vw] h-[40vw] rounded-full bg-primary/20"
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] -right-20 w-[30vw] h-[30vw] rounded-full bg-white/5"
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
              className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
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
                  className="h-10 md:h-12"
                >
                  <img 
                    src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
                    alt="Deewy" 
                    className="h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
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
          <div className="max-w-md hidden md:block">
            <p className="text-base md:text-lg font-medium text-white/60 leading-relaxed">
              {event.customText || 'Cada registro é uma cápsula do tempo. Explore sua galeria exclusiva e reviva seus melhores momentos.'}
            </p>
          </div>
          <div className="flex gap-6 md:gap-12 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1 md:mb-2">Total de Registros</div>
              <div className="text-2xl md:text-4xl font-black">{event.photoUrls.length}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1 md:mb-2">Data de Criação</div>
              <div className="text-2xl md:text-4xl font-black">{new Date(event.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Section */}
      <section className="px-8 md:px-16 py-32 bg-dark">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-20">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase">A <span style={{ color: primaryColor }}>Coleção</span></h2>
            {isMobile && (
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                {activeIndex + 1} / {event.photoUrls.length}
              </div>
            )}
          </div>
          {!isMobile && (
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
          )}
        </div>

        {/* Photo Grid with Pagination */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={isMobile ? 'mobile-scroll' : currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onScroll={handleScroll}
              className={`
                ${isMobile 
                  ? 'flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar -mx-8 px-8 scroll-smooth' 
                  : `grid gap-6 md:gap-8 ${viewMode === 'grid' ? 'grid-cols-5' : 'grid-cols-12'}`
                }
              `}
            >
              {(isMobile ? event.photoUrls : visiblePhotos).map((url, index) => {
                const globalIndex = isMobile ? index : (currentPage * itemsPerPage + index);
                const isEditorial = viewMode === 'masonry' && !isMobile;
                const isLarge = isEditorial && globalIndex % 7 === 0;
                const isTall = isEditorial && (globalIndex % 7 === 2 || globalIndex % 7 === 5);
                const isWide = isEditorial && globalIndex % 7 === 4;

                const shouldLoad = !isMobile || globalIndex <= maxLoadedIndex;

                return (
                  <motion.div
                    key={globalIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: isMobile ? 0 : index * 0.1 }}
                    className={`
                      relative group overflow-hidden rounded-[2rem] bg-white/5 cursor-pointer flex-shrink-0
                      ${isMobile ? 'w-[85vw] aspect-[3/4] snap-center' : 
                        !isEditorial ? 'aspect-[3/4]' : 
                        isLarge ? 'col-span-12 md:col-span-8 row-span-2 aspect-video md:aspect-auto' : 
                        isTall ? 'col-span-6 md:col-span-4 row-span-2 aspect-[3/5]' :
                        isWide ? 'col-span-12 md:col-span-8 aspect-video' :
                        'col-span-6 md:col-span-4 aspect-[3/4]'}
                    `}
                    onClick={() => setSelectedPhotoIndex(globalIndex)}
                  >
                    {shouldLoad && (
                      <img 
                        src={url} 
                        className={`w-full h-full object-cover transition-transform duration-1000 ${isMobile ? '' : 'group-hover:scale-110'}`}
                        alt={`Registro ${globalIndex + 1}`}
                        loading="lazy"
                      />
                    )}
                  
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-dark/60 rounded-full border border-white/10">
                      <Camera size={10} className="text-primary md:w-3 md:h-3" />
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest hidden md:inline">Captured by Deewy</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 md:p-8">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] md:text-xs font-black uppercase tracking-widest">Registro #{globalIndex + 1}</div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(url, `deewy-${event.name}-${globalIndex}.jpg`);
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
          </motion.div>
        </AnimatePresence>

        {/* Pagination Controls */}
        {totalPages > 1 && !isMobile && (
          <div className="flex flex-col items-center gap-6 mt-20">
            <div className="flex items-center gap-8">
              <button 
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-dark'}`}
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Página</div>
                <div className="text-xl font-black">
                  {currentPage + 1} <span className="text-white/20 mx-2">/</span> {totalPages}
                </div>
              </div>

              <button 
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentPage === totalPages - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-dark'}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        )}
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
          <p className="text-white/40 max-w-xl mx-auto font-medium text-base md:text-lg mb-16 px-6 hidden md:block">
            A Deewy acredita que cada clique é uma obra de arte. Obrigado por nos deixar fazer parte da sua história.
          </p>
          <div className="flex flex-col items-center">
            <img 
              src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png" 
              alt="Deewy" 
              className="h-12 md:h-16 w-auto object-contain mb-4"
              referrerPolicy="no-referrer"
            />
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
            className={`fixed inset-0 z-50 bg-dark/98 flex flex-col ${isMobile ? '' : 'backdrop-blur-md grain'}`}
          >
            {/* Lightbox Header - Transparent Bar */}
            <div className="h-[70px] md:h-[90px] px-4 md:px-6 flex items-center justify-between bg-transparent z-30 border-b border-white/5">
              <div className="flex items-center gap-4">
                <img 
                  src="https://res.cloudinary.com/drguum0vj/image/upload/v1773267528/Deewy-05_kn9ukp.jpg" 
                  alt="Deewy Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="h-4 w-px bg-white/10" />
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {selectedPhotoIndex + 1} / {event.photoUrls.length}
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6">
                {!isMobile && (
                  <button 
                    onClick={toggleZoom}
                    className={`flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-widest text-[8px] md:text-[10px] transition-all ${zoomScale > 1 ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Maximize2 size={14} className="md:w-4 md:h-4" /> 
                    <span className="hidden sm:inline">{zoomScale > 1 ? 'Reduzir' : 'Zoom'}</span>
                  </button>
                )}
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

            {/* Lightbox Image Viewport */}
            <div 
              className="flex-1 relative flex items-center justify-center overflow-hidden cursor-move touch-none"
              onClick={resetZoom}
              onWheel={handleWheel}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              ref={constraintsRef}
            >
              {zoomScale === 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    className="absolute left-4 md:left-8 z-20 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <ChevronLeft size={32} className="md:w-12 md:h-12" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    className="absolute right-4 md:right-8 z-20 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <ChevronRight size={32} className="md:w-12 md:h-12" />
                  </button>
                </>
              )}
              
              <motion.img 
                key={selectedPhotoIndex}
                style={{ x, y }}
                initial={{ opacity: 0, scale: isMobile ? 1 : 0.98 }}
                animate={{ 
                  opacity: 1, 
                  scale: zoomScale,
                }}
                transition={isMobile ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 30 }}
                drag={zoomScale > 1 ? true : (isMobile ? "x" : false)}
                dragConstraints={zoomScale > 1 ? dragConstraints : { left: 0, right: 0 }}
                dragElastic={isMobile && zoomScale === 1 ? 0.2 : 0}
                onDragEnd={(_, info) => {
                  if (zoomScale === 1 && isMobile) {
                    const threshold = 30; // Reduced threshold for easier swiping
                    if (info.offset.x < -threshold) nextPhoto();
                    else if (info.offset.x > threshold) prevPhoto();
                  }
                }}
                onDoubleClick={(e) => { e.stopPropagation(); if (!isMobile) toggleZoom(); }}
                onClick={(e) => e.stopPropagation()}
                onLoad={handleImageLoad}
                src={event.photoUrls[selectedPhotoIndex]} 
                className="max-w-full max-h-full object-contain"
                alt=""
              />
            </div>

            {/* Thumbnails - Transparent Bar (Current Page Only) */}
            {!isMobile && (
              <div className="h-[100px] md:h-[140px] px-4 md:px-6 overflow-x-auto flex items-center justify-center gap-3 md:gap-4 no-scrollbar bg-transparent z-30 border-t border-white/5">
                {visiblePhotos.map((url, i) => {
                  const globalIndex = currentPage * itemsPerPage + i;
                  return (
                    <button 
                      key={globalIndex}
                      onClick={() => setSelectedPhotoIndex(globalIndex)}
                      className={`w-12 h-16 md:w-16 md:h-20 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-500 ${selectedPhotoIndex === globalIndex ? 'border-primary scale-110 shadow-2xl shadow-primary/20' : 'border-transparent opacity-20 hover:opacity-50'}`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
