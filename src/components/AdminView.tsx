import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, push, onValue, set, remove, update } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LogOut, Copy, Trash2, ExternalLink, Image as ImageIcon, Type, Hash, Check, X, Edit3, Palette, Sparkles, Search, LayoutGrid, Briefcase, Heart, Camera, User as UserIcon, Instagram, FileText, FilePlus, Download, Eye } from 'lucide-react';
import { PhotoEvent, PortfolioData, Contract } from '../types';
import { jsPDF } from 'jspdf';

const PRESET_COLORS = ['#f0052d', '#090005', '#D4AF37', '#10B981', '#6366F1', '#FB7185', '#FFFFFF'];

const PHOTOGRAPHER_DATA = {
  name: 'Giancarlo Eduardo Ribeiro Silva',
  role: 'Fotógrafo',
  cpf: '551.917.868-23',
  address: 'Av. Joaquim janus penteado numero 341 - Jordanesia Cajamar - CEP: 07786520',
  brand: 'Deewy Studio™'
};

const CONTRACT_TEMPLATES = {
  time: (data: any) => `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS (POR TEMPO)

CONTRATADA: DEEWY STUDIO™, representada por ${PHOTOGRAPHER_DATA.name}, CPF ${PHOTOGRAPHER_DATA.cpf}, residente em ${PHOTOGRAPHER_DATA.address}.

CONTRATANTE: ${data.clientName}, CPF ${data.clientCpf || '________________'}, residente em ${data.clientAddress || '________________'}.

1. OBJETO: O presente contrato tem como objeto a prestação de serviços de fotografia para o evento/sessão: ${data.serviceDescription}.

2. LOCAL E DATA: O serviço será realizado em ${data.location}, no dia ${data.date}.

3. DURAÇÃO: A cobertura fotográfica terá a duração de ________ horas, iniciando às ________ e encerrando às ________.

4. VALOR E PAGAMENTO: Pelo serviço ora contratado, o CONTRATANTE pagará à CONTRATADA o valor total de R$ ${data.value}.

5. ENTREGA: As fotos serão entregues em formato digital através de galeria exclusiva no prazo de ________ dias úteis após a seleção.

6. DISPOSIÇÕES GERAIS: A CONTRATADA detém os direitos autorais das imagens, podendo utilizá-las para fins de portfólio e divulgação, salvo oposição expressa do CONTRATANTE.

Cajamar, ${new Date().toLocaleDateString('pt-BR')}

__________________________________________
${PHOTOGRAPHER_DATA.name} (DEEWY STUDIO™)

__________________________________________
${data.clientName} (CONTRATANTE)`,

  quantity: (data: any) => `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS (POR QUANTIDADE)

CONTRATADA: DEEWY STUDIO™, representada por ${PHOTOGRAPHER_DATA.name}, CPF ${PHOTOGRAPHER_DATA.cpf}, residente em ${PHOTOGRAPHER_DATA.address}.

CONTRATANTE: ${data.clientName}, CPF ${data.clientCpf || '________________'}, residente em ${data.clientAddress || '________________'}.

1. OBJETO: O presente contrato tem como objeto a prestação de serviços de fotografia para: ${data.serviceDescription}.

2. LOCAL E DATA: O serviço será realizado em ${data.location}, no dia ${data.date}.

3. ENTREGÁVEIS: Serão entregues o total de ${data.quantity || '____'} fotos editadas em alta resolução.

4. VALOR E PAGAMENTO: Pelo serviço ora contratado, o CONTRATANTE pagará à CONTRATADA o valor total de R$ ${data.value}.

5. SELEÇÃO: O CONTRATANTE terá acesso a uma galeria de provas para seleção das fotos em até ________ dias após o ensaio.

6. DISPOSIÇÕES GERAIS: A CONTRATADA detém os direitos autorais das imagens, podendo utilizá-las para fins de portfólio e divulgação, salvo oposição expressa do CONTRATANTE.

Cajamar, ${new Date().toLocaleDateString('pt-BR')}

__________________________________________
${PHOTOGRAPHER_DATA.name} (DEEWY STUDIO™)

__________________________________________
${data.clientName} (CONTRATANTE)`,

  monthly: (data: any) => `CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS (MENSAL/RECORRENTE)

CONTRATADA: DEEWY STUDIO™, representada por ${PHOTOGRAPHER_DATA.name}, CPF ${PHOTOGRAPHER_DATA.cpf}, residente em ${PHOTOGRAPHER_DATA.address}.

CONTRATANTE: ${data.clientName}, CPF ${data.clientCpf || '________________'}, residente em ${data.clientAddress || '________________'}.

1. OBJETO: O presente contrato tem como objeto a prestação de serviços recorrentes de fotografia para: ${data.serviceDescription}.

2. VIGÊNCIA: O contrato terá duração mensal, com renovação automática, podendo ser rescindido por qualquer uma das partes com aviso prévio de 30 dias.

3. FREQUÊNCIA: Serão realizadas ________ sessões mensais, em datas a serem combinadas.

4. VALOR MENSAL: Pelo serviço ora contratado, o CONTRATANTE pagará à CONTRATADA o valor mensal de R$ ${data.value}.

5. ENTREGA: As fotos de cada sessão serão entregues em até ________ dias úteis após a realização.

6. DISPOSIÇÕES GERAIS: A CONTRATADA detém os direitos autorais das imagens, podendo utilizá-las para fins de portfólio e divulgação, salvo oposição expressa do CONTRATANTE.

Cajamar, ${new Date().toLocaleDateString('pt-BR')}

__________________________________________
${PHOTOGRAPHER_DATA.name} (DEEWY STUDIO™)

__________________________________________
${data.clientName} (CONTRATANTE)`
};

export default function AdminView({ user }: { user: User }) {
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'portfolio' | 'contracts'>('events');
  
  // Portfolio State
  const [portfolio, setPortfolio] = useState<PortfolioData>({ urls: [] });
  const [portfolioUrlsInput, setPortfolioUrlsInput] = useState('');
  
  // Event Form State
  const [editingEvent, setEditingEvent] = useState<PhotoEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    photoUrls: '',
    customText: '',
    driveLink: '',
    showSocialTips: false
  });

  // Contract Form State
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractFormData, setContractFormData] = useState({
    clientName: '',
    clientCpf: '',
    clientAddress: '',
    serviceType: 'time' as 'time' | 'quantity' | 'monthly' | 'other',
    serviceDescription: '',
    location: '',
    value: '',
    date: '',
    content: ''
  });
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    event.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContracts = contracts.filter(contract => 
    contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contract.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const eventsRef = ref(db, `users/${user.uid}/events`);
    const portfolioRef = ref(db, `users/${user.uid}/portfolio`);
    const contractsRef = ref(db, `users/${user.uid}/contracts`);

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
    }, (err) => console.error("Erro ao carregar eventos:", err));

    const unsubscribeContracts = onValue(contractsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setContracts(list.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setContracts([]);
      }
    }, (err) => console.error("Erro ao carregar contratos:", err));

    const unsubscribePortfolio = onValue(portfolioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPortfolio(data);
        // Only set input if it's currently empty to avoid overwriting user typing
        setPortfolioUrlsInput(prev => {
          if (!prev && data.urls) return data.urls.join('\n');
          return prev;
        });
      }
    }, (err) => console.error("Erro ao carregar portfólio:", err));

    return () => {
      unsubscribeEvents();
      unsubscribePortfolio();
      unsubscribeContracts();
    };
  }, [user.uid]);

  const parsePhotoUrls = (input: string) => {
    return input
      .split(/[\n, ]+/)
      .map(url => url.trim())
      .filter(url => url !== '' && url.startsWith('http'));
  };

  const handleSavePortfolio = async () => {
    setIsSaving(true);
    try {
      const updatedPortfolio = {
        ...portfolio,
        urls: parsePhotoUrls(portfolioUrlsInput)
      };
      await set(ref(db, `users/${user.uid}/portfolio`), updatedPortfolio);
      await set(ref(db, `public_portfolio/${user.uid}`), updatedPortfolio);
      // Show success feedback
      const btn = document.getElementById('save-portfolio-btn');
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = 'Salvo!';
        setTimeout(() => btn.innerText = originalText, 2000);
      }
    } catch (err) {
      console.error("Erro ao salvar portfólio:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (event?: PhotoEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        photoUrls: event.photoUrls.join('\n'),
        customText: event.customText,
        driveLink: event.driveLink || '',
        showSocialTips: event.showSocialTips || false
      });
    } else {
      setEditingEvent(null);
      setFormData({
        name: '',
        photoUrls: '',
        customText: '',
        driveLink: '',
        showSocialTips: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const eventData = {
      name: formData.name,
      photoUrls: parsePhotoUrls(formData.photoUrls),
      customText: formData.customText,
      driveLink: formData.driveLink,
      showSocialTips: formData.showSocialTips,
      updatedAt: Date.now()
    };

    try {
      if (editingEvent) {
        await update(ref(db, `users/${user.uid}/events/${editingEvent.id}`), eventData);
        await update(ref(db, `public_events/${editingEvent.code}`), { ...eventData, ownerId: user.uid, code: editingEvent.code, createdAt: editingEvent.createdAt });
      } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newEventData = { ...eventData, code, createdAt: Date.now() };
        const newEventRef = push(ref(db, `users/${user.uid}/events`));
        await set(newEventRef, newEventData);
        await set(ref(db, `public_events/${code}`), { ...newEventData, ownerId: user.uid });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(err => {
        console.error('Erro ao copiar link:', err);
      });
    }
  };

  const handleOpenContractModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setContractFormData({
        clientName: contract.clientName,
        clientCpf: contract.clientCpf || '',
        clientAddress: contract.clientAddress || '',
        serviceType: contract.serviceType,
        serviceDescription: contract.serviceDescription,
        location: contract.location,
        value: contract.value,
        date: contract.date,
        content: contract.content
      });
    } else {
      setEditingContract(null);
      setContractFormData({
        clientName: '',
        clientCpf: '',
        clientAddress: '',
        serviceType: 'time',
        serviceDescription: '',
        location: '',
        value: '',
        date: '',
        content: ''
      });
    }
    setIsContractModalOpen(true);
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const contractData = {
      ...contractFormData,
      updatedAt: Date.now()
    };

    try {
      if (editingContract) {
        await update(ref(db, `users/${user.uid}/contracts/${editingContract.id}`), contractData);
      } else {
        const newContractRef = push(ref(db, `users/${user.uid}/contracts`));
        await set(newContractRef, { ...contractData, createdAt: Date.now() });
      }
      setIsContractModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      await remove(ref(db, `users/${user.uid}/contracts/${contractId}`));
    }
  };

  const applyTemplate = (type: keyof typeof CONTRACT_TEMPLATES) => {
    const content = CONTRACT_TEMPLATES[type](contractFormData);
    setContractFormData(prev => ({ ...prev, content }));
  };

  const exportContractPDF = async (contract: Contract) => {
    const doc = new jsPDF();
    const logoUrl = 'https://res.cloudinary.com/drguum0vj/image/upload/v1773267564/Deewy_zpnbng.png';

    const addImageFromUrl = (url: string, x: number, y: number, w: number, h: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', x, y, w, h);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    };

    // Design Elements - Header
    doc.setFillColor(10, 10, 10); // Deep Black
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFillColor(240, 5, 45); // Primary Red Accent
    doc.rect(0, 43, 210, 2, 'F');

    // Decorative "riscos" in header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.1);
    for(let i = 0; i < 10; i++) {
      doc.line(150 + (i * 5), 0, 180 + (i * 5), 45);
    }

    await addImageFromUrl(logoUrl, 20, 12, 40, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DOCUMENTO CONTRATUAL', 190, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, 190, 24, { align: 'right' });
    doc.text(`REF: ${contract.id.substring(0, 8).toUpperCase()}`, 190, 28, { align: 'right' });

    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 105, 65, { align: 'center' });
    
    doc.setDrawColor(240, 5, 45);
    doc.setLineWidth(0.8);
    doc.line(75, 70, 135, 70);

    // Vertical decorative line
    doc.setFillColor(240, 5, 45);
    doc.rect(10, 60, 0.5, 210, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const splitContent = doc.splitTextToSize(contract.content, 170);
    let yPos = 85;
    const lineHeight = 6;
    const pageHeight = 270;

    splitContent.forEach((line: string) => {
      if (yPos > pageHeight) {
        // Footer for the current page before adding a new one
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Página ' + doc.internal.pages.length, 105, 290, { align: 'center' });
        
        doc.addPage();
        // Header for new page
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setFillColor(240, 5, 45);
        doc.rect(0, 13, 210, 2, 'F');
        
        // Vertical line on new page
        doc.setFillColor(240, 5, 45);
        doc.rect(10, 20, 0.5, 250, 'F');

        yPos = 30;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
      }
      doc.text(line, 20, yPos);
      yPos += lineHeight;
    });

    // Footer - Final Page
    const finalY = 275;
    
    // Corner accent
    doc.setFillColor(240, 5, 45);
    doc.triangle(210, 297, 210, 285, 195, 297, 'F');

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(20, finalY, 190, finalY);
    
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.text(PHOTOGRAPHER_DATA.brand, 105, finalY + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${PHOTOGRAPHER_DATA.name} | CPF: ${PHOTOGRAPHER_DATA.cpf}`, 105, finalY + 13, { align: 'center' });
    doc.setFontSize(7);
    doc.text(PHOTOGRAPHER_DATA.address, 105, finalY + 18, { align: 'center' });

    doc.save(`contrato-${contract.clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans selection:bg-primary selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 bg-[#0F0F0F] border-r border-white/5 flex flex-col sticky top-0 h-auto md:h-screen z-50">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
              <Camera size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Deewy</h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase mt-1">Studio Admin</p>
            </div>
          </div>

          <nav className="space-y-3">
            <button 
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${activeTab === 'events' ? 'bg-white text-black shadow-2xl shadow-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutGrid size={18} /> Galerias
            </button>
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${activeTab === 'portfolio' ? 'bg-white text-black shadow-2xl shadow-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              <Sparkles size={18} /> Portfólio
            </button>
            <button 
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${activeTab === 'contracts' ? 'bg-white text-black shadow-2xl shadow-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              <FileText size={18} /> Contratos
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 space-y-8">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-0.5">Logado como</p>
              <p className="text-xs font-bold truncate text-white/60">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white text-white/30 font-black uppercase tracking-widest text-[10px] transition-all duration-300"
          >
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Dashboard v2.0</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-6">
              {activeTab === 'events' ? <>Suas <br/><span className="text-primary">Galerias.</span></> : 
               activeTab === 'portfolio' ? <>Seu <br/><span className="text-primary">Portfólio.</span></> :
               <>Seus <br/><span className="text-primary">Contratos.</span></>}
            </h2>
            <p className="text-white/40 font-medium max-w-lg text-lg leading-relaxed">
              {activeTab === 'events' 
                ? 'Gerencie seus registros visuais com elegância. Cada galeria é uma experiência única para seus clientes.' 
                : activeTab === 'portfolio'
                ? 'Curadoria da sua vitrine principal. Selecione as obras que definem sua identidade visual.'
                : 'Gerencie e emita contratos profissionais para seus clientes com templates otimizados.'}
            </p>
          </motion.div>

          {activeTab === 'events' ? (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenModal()}
              className="bg-white text-black px-12 py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-white/5 flex items-center gap-4 hover:bg-primary hover:text-white transition-all duration-500"
            >
              <Plus size={20} /> Criar Nova Galeria
            </motion.button>
          ) : activeTab === 'portfolio' ? (
            <motion.button 
              id="save-portfolio-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSavePortfolio}
              disabled={isSaving}
              className="bg-white text-black px-12 py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-white/5 flex items-center gap-4 hover:bg-primary hover:text-white transition-all duration-500 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : <><Check size={20} /> Salvar Vitrine</>}
            </motion.button>
          ) : (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenContractModal()}
              className="bg-white text-black px-12 py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-white/5 flex items-center gap-4 hover:bg-primary hover:text-white transition-all duration-500"
            >
              <FilePlus size={20} /> Novo Contrato
            </motion.button>
          )}
        </header>

        {activeTab === 'events' ? (
          <div className="space-y-12">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white/5 rounded-3xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white placeholder:text-white/20"
              />
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                        {event.photoUrls && event.photoUrls.length > 0 ? (
                          <img 
                            src={event.photoUrls[0]} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt="" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <ImageIcon size={32} />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenModal(event)}
                          className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id, event.code)}
                          className="p-3 bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">#{event.code}</span>
                          <button 
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(event.code).then(() => {
                                  setCopiedId(event.code + '_code');
                                  setTimeout(() => setCopiedId(null), 2000);
                                }).catch(() => {});
                              }
                            }}
                            className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition-all text-white/20 hover:text-white"
                            title="Copiar Código"
                          >
                            {copiedId === event.code + '_code' ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-1">{event.name}</h3>
                      <p className="text-white/40 text-sm font-medium line-clamp-2 min-h-[40px] leading-relaxed">
                        {event.customText || 'Sem descrição personalizada.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Registros</span>
                        <span className="text-2xl font-black">{event.photoUrls.length}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => copyLink(event.code)}
                          className={`p-4 rounded-2xl transition-all ${copiedId === event.code ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-primary hover:text-white'}`}
                        >
                          {copiedId === event.code ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                        <a 
                          href={`/galeria?codigo=${event.code}`}
                          target="_blank"
                          className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center hover:bg-primary transition-all"
                        >
                          <ExternalLink size={20} />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : activeTab === 'portfolio' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl space-y-12"
          >
            <div className="bg-[#111111] rounded-[3rem] p-10 border border-white/5 space-y-8">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center shadow-xl">
                  <ImageIcon size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Vitrine de Imagens</h3>
                  <p className="text-white/40 font-medium">Cole os links das fotos que deseja exibir na Home.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Hash size={14} /> Links das Imagens (Um por linha)
                  </label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    {parsePhotoUrls(portfolioUrlsInput).length} Fotos Detectadas
                  </span>
                </div>
                <textarea 
                  className="w-full min-h-[500px] p-10 bg-black/40 rounded-[2.5rem] border border-white/5 focus:border-primary/50 outline-none transition-all font-mono text-sm leading-relaxed resize-none custom-scrollbar"
                  placeholder="https://images.unsplash.com/photo-1...&#10;https://images.unsplash.com/photo-2..."
                  value={portfolioUrlsInput}
                  onChange={(e) => setPortfolioUrlsInput(e.target.value)}
                />
              </div>

              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> Dicas de Curadoria
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="text-xs text-white/40 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Priorize imagens de alta resolução para um visual premium.
                    </li>
                    <li className="text-xs text-white/40 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Fotos verticais (4:5) criam um ritmo melhor na galeria.
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-48 h-24 bg-black rounded-2xl border border-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Capacidade</p>
                    <p className="text-2xl font-black text-white">Ilimitada</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="text"
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white/5 rounded-3xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white placeholder:text-white/20"
              />
            </div>

            {/* Contract Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredContracts.map((contract, idx) => (
                  <motion.div
                    key={contract.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                        <FileText size={28} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenContractModal(contract)}
                          className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteContract(contract.id)}
                          className="p-3 bg-white/5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                          {contract.serviceType === 'time' ? 'Por Tempo' : 
                           contract.serviceType === 'quantity' ? 'Por Quantidade' : 
                           contract.serviceType === 'monthly' ? 'Mensal' : 'Outro'}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-1">{contract.clientName}</h3>
                      <p className="text-white/40 text-sm font-medium line-clamp-2 min-h-[40px] leading-relaxed">
                        {contract.serviceDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Valor</span>
                        <span className="text-xl font-black">R$ {contract.value}</span>
                      </div>
                      <button 
                        onClick={() => exportContractPDF(contract)}
                        className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl"
                        title="Exportar PDF"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-4xl bg-[#111111] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 md:p-16 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-2">
                      {editingEvent ? 'Editar' : 'Novo'} <span className="text-primary">Registro</span>
                    </h2>
                    <p className="text-white/40 font-medium">Configure os detalhes da sua galeria exclusiva.</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Type size={14} /> Nome do Evento
                      </label>
                      <input
                        required
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="Ex: Editorial Verão 2026"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <ExternalLink size={14} /> Link do Google Drive (Opcional)
                      </label>
                      <input
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="https://drive.google.com/..."
                        value={formData.driveLink}
                        onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <ImageIcon size={14} /> URLs das Fotos (Uma por linha)
                      </label>
                      <span className="text-[10px] font-bold text-primary">
                        {parsePhotoUrls(formData.photoUrls).length} Fotos
                      </span>
                    </div>
                    <textarea
                      required
                      rows={6}
                      className="w-full p-8 bg-white/5 rounded-[2rem] border border-white/10 focus:border-primary/50 outline-none transition-all font-mono text-xs resize-none custom-scrollbar"
                      placeholder="https://images.unsplash.com/photo-1..."
                      value={formData.photoUrls}
                      onChange={(e) => setFormData({ ...formData, photoUrls: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Type size={14} /> Mensagem para o Cliente
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-8 bg-white/5 rounded-[2rem] border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white resize-none"
                      placeholder="Uma mensagem especial que aparecerá no topo da galeria..."
                      value={formData.customText}
                      onChange={(e) => setFormData({ ...formData, customText: e.target.value })}
                    />
                  </div>

                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.showSocialTips ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/20'}`}>
                        <Instagram size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tighter">Dicas de Redes Sociais</h4>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Ativar guia de postagem para o cliente</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showSocialTips: !formData.showSocialTips })}
                      className={`w-14 h-8 rounded-full relative transition-all duration-500 ${formData.showSocialTips ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: formData.showSocialTips ? 24 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-10 py-6 rounded-3xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-primary text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : (editingEvent ? 'Salvar Alterações' : 'Criar Galeria')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contract Modal */}
      <AnimatePresence>
        {isContractModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContractModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-5xl bg-[#111111] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-10 md:p-16 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-2">
                      {editingContract ? 'Editar' : 'Novo'} <span className="text-primary">Contrato</span>
                    </h2>
                    <p className="text-white/40 font-medium">Gere documentos profissionais com templates inteligentes.</p>
                  </div>
                  <button 
                    onClick={() => setIsContractModalOpen(false)} 
                    className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleContractSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <UserIcon size={14} /> Nome do Cliente
                      </label>
                      <input
                        required
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="Nome Completo"
                        value={contractFormData.clientName}
                        onChange={(e) => setContractFormData({ ...contractFormData, clientName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Hash size={14} /> CPF do Cliente
                      </label>
                      <input
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="000.000.000-00"
                        value={contractFormData.clientCpf}
                        onChange={(e) => setContractFormData({ ...contractFormData, clientCpf: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <LayoutGrid size={14} /> Tipo de Contrato
                      </label>
                      <select
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white appearance-none cursor-pointer"
                        value={contractFormData.serviceType}
                        onChange={(e) => setContractFormData({ ...contractFormData, serviceType: e.target.value as any })}
                      >
                        <option value="time">Por Tempo</option>
                        <option value="quantity">Por Quantidade</option>
                        <option value="monthly">Mensal</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Briefcase size={14} /> Descrição do Serviço
                      </label>
                      <input
                        required
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="Ex: Ensaio Gestante / Cobertura Casamento"
                        value={contractFormData.serviceDescription}
                        onChange={(e) => setContractFormData({ ...contractFormData, serviceDescription: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Camera size={14} /> Local do Serviço
                      </label>
                      <input
                        required
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="Endereço ou Estúdio"
                        value={contractFormData.location}
                        onChange={(e) => setContractFormData({ ...contractFormData, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Sparkles size={14} /> Valor Total (R$)
                      </label>
                      <input
                        required
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        placeholder="0.000,00"
                        value={contractFormData.value}
                        onChange={(e) => setContractFormData({ ...contractFormData, value: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <LayoutGrid size={14} /> Data do Serviço
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-8 py-5 bg-white/5 rounded-2xl border border-white/10 focus:border-primary/50 outline-none transition-all font-medium text-white"
                        value={contractFormData.date}
                        onChange={(e) => setContractFormData({ ...contractFormData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <button 
                        type="button"
                        onClick={() => applyTemplate('time')}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                      >
                        Template Tempo
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyTemplate('quantity')}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                      >
                        Template Quantidade
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyTemplate('monthly')}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                      >
                        Template Mensal
                      </button>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <FileText size={14} /> Conteúdo do Contrato
                      </label>
                      <textarea
                        required
                        rows={12}
                        className="w-full p-10 bg-black/40 rounded-[2.5rem] border border-white/10 focus:border-primary/50 outline-none transition-all font-mono text-sm leading-relaxed resize-none custom-scrollbar"
                        value={contractFormData.content}
                        onChange={(e) => setContractFormData({ ...contractFormData, content: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsContractModalOpen(false)}
                      className="flex-1 px-10 py-6 rounded-3xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-primary text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : (editingContract ? 'Salvar Alterações' : 'Gerar Contrato')}
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
