import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, push, onValue, set, remove, update } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LogOut, Copy, Trash2, ExternalLink, Image as ImageIcon, Type, Hash, Check, X, Edit3, Palette, Sparkles, Search, LayoutGrid, Briefcase, Heart, Camera } from 'lucide-react';
import { PhotoEvent, PortfolioData } from '../types';

const PRESET_COLORS = ['#E60023', '#0A0A0A', '#D4AF37', '#10B981', '#6366F1', '#FB7185', '#FFFFFF'];

export default function AdminView({ user }: { user: User }) {
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'portfolio'>('events');
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    categories: { negocios: [], impacto: [], cotidiano: [] }
  });
  const [editingEvent, setEditingEvent] = useState<PhotoEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    photoUrls: '',
    customText: '',
    logoUrl: '',
    primaryColor: '#E60023',
    secondaryColor: '#0A0A0A'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    event.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const eventsRef = ref(db, `users/${user.uid}/events`);
    const portfolioRef = ref(db, `users/${user.uid}/portfolio`);

    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setEvents(list.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setEvents([]);
      }
    });

    const unsubscribePortfolio = onValue(portfolioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPortfolio(data);
      }
    });

    return () => {
      unsubscribeEvents();
      unsubscribePortfolio();
    };
  }, [user.uid]);

  const parsePhotoUrls = (input: string) => {
    return input
      .split(/[\n, ]+/)
      .map(url => url.trim())
      .filter(url => url !== '' && url.startsWith('http'));
  };

  const handleSavePortfolio = async (category: keyof PortfolioData['categories'], urls: string) => {
    const photoUrls = parsePhotoUrls(urls);
    try {
      // Save to user's private path
      await set(ref(db, `users/${user.uid}/portfolio/categories/${category}`), photoUrls);
      // Also save to a public path for the Home page to fetch easily
      // We use the user.uid subnode to ensure the user has write permissions
      await set(ref(db, `public_portfolio/${user.uid}/categories/${category}`), photoUrls);
    } catch (err) {
      console.error("Erro ao salvar portfólio:", err);
      alert('Erro de permissão ao salvar portfólio. Tentando salvar apenas localmente...');
    }
  };

  const handleOpenModal = (event?: PhotoEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        photoUrls: event.photoUrls.join('\n'),
        customText: event.customText,
        logoUrl: event.logoUrl || '',
        primaryColor: event.primaryColor || '#E60023',
        secondaryColor: event.secondaryColor || '#0A0A0A'
      });
    } else {
      setEditingEvent(null);
      setFormData({
        name: '',
        photoUrls: '',
        customText: '',
        logoUrl: '',
        primaryColor: '#E60023',
        secondaryColor: '#0A0A0A'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      name: formData.name,
      photoUrls: parsePhotoUrls(formData.photoUrls),
      customText: formData.customText,
      logoUrl: formData.logoUrl,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      updatedAt: Date.now()
    };

    try {
      if (editingEvent) {
        // Update existing
        await update(ref(db, `users/${user.uid}/events/${editingEvent.id}`), eventData);
        await update(ref(db, `public_events/${editingEvent.code}`), { ...eventData, ownerId: user.uid, code: editingEvent.code, createdAt: editingEvent.createdAt });
      } else {
        // Create new
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newEventData = { ...eventData, code, createdAt: Date.now() };
        const newEventRef = push(ref(db, `users/${user.uid}/events`));
        await set(newEventRef, newEventData);
        await set(ref(db, `public_events/${code}`), { ...newEventData, ownerId: user.uid });
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar evento');
    }
  };

  const handleDelete = async (eventId: string, code: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      await remove(ref(db, `users/${user.uid}/events/${eventId}`));
      await remove(ref(db, `public_events/${code}`));
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/galeria?codigo=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'negocios', name: 'Negócios' },
    { id: 'impacto', name: 'Impacto Social' },
    { id: 'cotidiano', name: 'Cotidiano' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20 grain">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 180 }}
              className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/20"
            >
              D
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase">Deewy</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Registro Visual</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user.email}</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Account</span>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-16">
        {/* Tab Switcher */}
        <div className="flex gap-4 mb-12">
          <button 
            onClick={() => setActiveTab('events')}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'events' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid size={20} /> Galerias
          </button>
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'portfolio' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-gray-400 hover:text-gray-600'}`}
          >
            <Camera size={20} /> Portfólio Inicial
          </button>
        </div>

        {activeTab === 'events' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none mb-4">
              Suas <span className="text-primary">Galerias</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-md">
              Gerencie seus registros visuais com elegância e sofisticação. Cada evento é uma história única.
            </p>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center justify-center gap-3 px-10 py-5 text-lg"
          >
            <Plus size={24} /> Criar Novo Registro
          </motion.button>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white rounded-3xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
            />
          </div>
        </motion.div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                {/* Color Accents */}
                <div 
                  className="absolute top-0 left-0 w-full h-2 rounded-t-[2.5rem]" 
                  style={{ backgroundColor: event.primaryColor || '#E60023' }}
                />

                <div className="flex justify-between items-start mb-8">
                  <div 
                    className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex items-center justify-center bg-gray-50"
                  >
                    {event.photoUrls && event.photoUrls.length > 0 ? (
                      <img 
                        src={event.photoUrls[0]} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{ backgroundColor: event.primaryColor || '#E60023' }}
                      >
                        <ImageIcon size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(event)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id, event.code)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">#{event.code}</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase mb-3 leading-tight">{event.name}</h3>
                  <p className="text-gray-500 text-sm font-medium line-clamp-2 min-h-[40px]">
                    {event.customText || 'Sem descrição personalizada.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registros</span>
                    <span className="text-xl font-black">{event.photoUrls.length}</span>
                  </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => copyLink(event.code)}
                        className={`p-4 rounded-2xl transition-all ${copiedId === event.code ? 'bg-green-500 text-white' : 'bg-dark text-white hover:bg-primary shadow-xl shadow-dark/10'}`}
                      >
                        {copiedId === event.code ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                      <a 
                        href={`/galeria?codigo=${event.code}`}
                        target="_blank"
                        className="w-14 h-14 bg-gray-100 text-dark rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                </div>
              </motion.div>
            ))}
            {filteredEvents.length === 0 && events.length > 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 font-medium">Nenhum resultado encontrado para sua busca.</p>
              </div>
            )}
          </AnimatePresence>

          {events.length === 0 && !isModalOpen && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
              <div className="inline-block p-8 bg-gray-50 rounded-[2rem] text-gray-200 mb-6">
                <Sparkles size={64} />
              </div>
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Sua jornada começa aqui</h3>
              <p className="text-gray-400 font-medium">Crie sua primeira galeria e encante seus clientes.</p>
            </div>
          )}
        </div>
      </>
    ) : (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 pb-32"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Curadoria de Marca
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Seu <span className="text-primary">Portfólio</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mt-4">
              Estas são as imagens que definem a identidade visual da Deewy na página inicial. Use links diretos de alta qualidade.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {categories.map((cat) => (
            <motion.div 
              key={cat.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-16 -mt-16 transition-all group-hover:bg-primary/10" />
              
              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  cat.id === 'negocios' ? 'bg-blue-50 text-blue-600' :
                  cat.id === 'impacto' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {cat.id === 'negocios' ? <Briefcase size={28} /> :
                   cat.id === 'impacto' ? <Heart size={28} /> :
                   <Camera size={28} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{cat.name}</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoria Principal</span>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <ImageIcon size={12} /> Links das Imagens
                  </label>
                  <textarea 
                    className="w-full min-h-[250px] p-6 bg-gray-50 rounded-3xl border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-[11px] leading-relaxed resize-none"
                    placeholder="Cole os links aqui...&#10;Um por linha."
                    defaultValue={portfolio.categories?.[cat.id as keyof PortfolioData['categories']]?.join('\n')}
                    onBlur={(e) => handleSavePortfolio(cat.id as keyof PortfolioData['categories'], e.target.value)}
                  />
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Check size={12} className="text-green-500" /> Dicas de Upload
                  </h4>
                  <ul className="space-y-2">
                    <li className="text-[11px] text-gray-500 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      Use links permanentes (ex: Unsplash, Imgur, Firebase).
                    </li>
                    <li className="text-[11px] text-gray-500 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      Imagens verticais (4:5) funcionam melhor no design.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Status</span>
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Ativo
                  </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {portfolio.categories?.[cat.id as keyof PortfolioData['categories']]?.length || 0} Fotos
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-dark text-white rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <Sparkles size={40} />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tighter uppercase">Salvamento Inteligente</h3>
              <p className="text-white/40 font-medium max-w-sm">
                Suas alterações são sincronizadas em tempo real com a página inicial assim que você termina de digitar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Sistema Online
          </div>
        </motion.div>
      </motion.div>
    )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase">
                      {editingEvent ? 'Editar' : 'Novo'} <span className="text-primary">Registro</span>
                    </h2>
                    <p className="text-gray-400 font-medium">Preencha os detalhes da sua galeria exclusiva.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded-2xl transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Type size={14} /> Nome do Evento
                      </label>
                      <input
                        required
                        className="input-field"
                        placeholder="Ex: Editorial Verão 2026"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Palette size={14} /> Primária
                        </label>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <input
                              type="color"
                              className="w-14 h-14 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                              value={formData.primaryColor}
                              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            />
                            <input 
                              className="flex-1 px-3 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                              value={formData.primaryColor}
                              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({ ...formData, primaryColor: color })}
                                className={`w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110 ${formData.primaryColor === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Palette size={14} /> Secundária
                        </label>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <input
                              type="color"
                              className="w-14 h-14 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                              value={formData.secondaryColor}
                              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            />
                            <input 
                              className="flex-1 px-3 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                              value={formData.secondaryColor}
                              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({ ...formData, secondaryColor: color })}
                                className={`w-6 h-6 rounded-full border border-gray-100 transition-transform hover:scale-110 ${formData.secondaryColor === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <ImageIcon size={14} /> URL do Logotipo Personalizado (Opcional)
                    </label>
                    <input
                      className="input-field"
                      placeholder="https://exemplo.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <ImageIcon size={14} /> URLs das Fotos (Uma por linha)
                    </label>
                    <textarea
                      required
                      rows={8}
                      className="input-field resize-none font-mono text-xs"
                      placeholder="https://images.unsplash.com/photo-1..."
                      value={formData.photoUrls}
                      onChange={(e) => setFormData({ ...formData, photoUrls: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Type size={14} /> Texto Personalizado
                    </label>
                    <textarea
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Uma mensagem especial para seu cliente..."
                      value={formData.customText}
                      onChange={(e) => setFormData({ ...formData, customText: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-8 py-5 rounded-full font-bold uppercase tracking-widest text-xs border-2 border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 btn-primary py-5 uppercase tracking-widest text-xs"
                    >
                      {editingEvent ? 'Salvar Alterações' : 'Criar Galeria'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
