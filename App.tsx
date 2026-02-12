import React, { useState, useEffect } from 'react';
import { 
  EducationLevel, 
  Fase,
  Semester,
  PedagogicalPractice, 
  KopType,
  DIMENSIONS, 
  METHODS,
  RPMData, 
  GeneratedRPM 
} from './types';
import { generateRPMContent } from './services/geminiService';
import ResultTable from './components/ResultTable';

// Fix: AIStudio type declaration must match the global definition provided by the environment.
// The error indicated that aistudio is already defined as AIStudio on the Window object.
declare global {
  interface Window {
    readonly aistudio: AIStudio;
  }
}

type AppView = 'landing' | 'settings' | 'generator' | 'missing_key';

const TAHUN_PELAJARAN_OPTIONS = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028'
];

const LOADING_MESSAGES = [
  "Menganalisis Capaian Pembelajaran...",
  "Menyusun langkah pembelajaran bermakna...",
  "Membuat instrumen asesmen HOTS...",
  "Merancang LKPD eksploratif...",
  "Menyiapkan bahan bacaan literasi...",
  "Hampir selesai, sedang merapikan dokumen..."
];

const getKelasOptions = (level: EducationLevel) => {
  switch (level) {
    case EducationLevel.SD: return ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    case EducationLevel.SMP: return ['Kelas 7', 'Kelas 8', 'Kelas 9'];
    case EducationLevel.SMA:
    case EducationLevel.SMK: return ['Kelas 10', 'Kelas 11', 'Kelas 12'];
    default: return [];
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rpmData, setRpmData] = useState<RPMData | null>(null);
  const [generated, setGenerated] = useState<GeneratedRPM | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!process.env.API_KEY);

  useEffect(() => {
    const checkKey = async () => {
      if (!hasApiKey && window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          if (selected) setHasApiKey(true);
        } catch (e) {
          console.debug("AI Studio bridge not available");
        }
      }
    };
    checkKey();
  }, [hasApiKey]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [formData, setFormData] = useState<RPMData>({
    satuanPendidikan: 'SMK NEGERI 1 MOOTILANGO',
    tahunPelajaran: '2024/2025',
    namaGuru: 'Arman Sue Nani',
    nipGuru: '198903122025211077',
    namaKepalaSekolah: 'Rohana, S.Pd, M.Pd',
    nipKepalaSekolah: '197909102006042035',
    jenjang: EducationLevel.SMK,
    fase: Fase.E,
    kelas: 'Kelas 10',
    semester: Semester.Ganjil,
    mapel: '',
    cp: '',
    tujuan: '',
    materi: '',
    lintasMateri: '',
    kemitraan: '',
    pemanfaatanDigitalInput: '',
    durasi: '2 x 45 Menit',
    kesiapanSiswa: '',
    praktikPedagogis: PedagogicalPractice.ProblemSolving,
    dimensiLulusan: ['Penalaran Kritis', 'Kreativitas', 'Kolaborasi'],
    metode: ['Diskusi Kelompok', 'Tanya Jawab'],
    ruangFisik: true,
    ruangVirtual: false,
    logoSekolah: '',
    logoProvinsi: '',
    kopType: KopType.Gambar,
    manualHeader: 'Jl. Bendungan Desa Paris Kec. Mootilango Kab. Gorontalo'
  });

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setView('landing');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (name === 'jenjang') {
          const classes = getKelasOptions(value as EducationLevel);
          newData.kelas = classes[0] || '';
          if (value === EducationLevel.SD) newData.fase = Fase.A;
          else if (value === EducationLevel.SMP) newData.fase = Fase.D;
          else if (value === EducationLevel.SMA || value === EducationLevel.SMK) newData.fase = Fase.E;
        }
        return newData;
      });
    }
  };

  const toggleMultiSelect = (field: 'dimensiLulusan' | 'metode', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoSekolah' | 'logoProvinsi') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) {
        alert("Ukuran file terlalu besar! Maksimal 1 MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApiKey && !window.aistudio) {
      setError("API Key belum dikonfigurasi. Silakan atur di Environment Variables Vercel.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateRPMContent(formData);
      setGenerated(result);
      setRpmData(formData);
      setTimeout(() => {
        const resultElement = document.getElementById('result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      if (err.message?.includes("entity was not found") && window.aistudio) {
        setHasApiKey(false);
        setView('missing_key');
      }
      setError(err.message || "Gagal membuat RPM. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'missing_key' || (!hasApiKey && view !== 'landing' && !window.aistudio)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-8 text-white">
        <div className="max-w-md text-center space-y-6 animate-in">
          <div className="bg-red-500/20 p-6 rounded-full inline-block border border-red-500/50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0 12a9 9 0 110-18 9 9 0 010 18z" />
             </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight">API Key Belum Terpasang</h2>
          <p className="text-slate-400">Aplikasi memerlukan API Key Gemini untuk berfungsi. Silakan hubungkan API Key Anda.</p>
          <div className="pt-4 space-y-4">
            {window.aistudio && (
              <button 
                onClick={handleOpenKeySelector}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
              >
                HUBUNGKAN API KEY
              </button>
            )}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-sm text-indigo-400 hover:underline font-bold"
            >
              Dapatkan API Key Gratis di Google AI Studio →
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-blue-500 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-indigo-500 rounded-full blur-[150px] animate-pulse"></div>
        </div>
        <div className="max-w-4xl w-full text-center space-y-10 animate-in duration-700 relative z-10">
          <div className="inline-block p-6 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] mb-4 border border-white/10 shadow-2xl">
             <div className="bg-indigo-600 p-4 rounded-3xl shadow-indigo-500/50 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            GENERATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-500">RPM</span>
          </h1>
          <p className="text-xl md:text-3xl text-indigo-100 font-light max-w-2xl mx-auto leading-relaxed opacity-80">
            Platform AI Profesional untuk Penyusunan <span className="font-bold text-white italic underline decoration-indigo-500 underline-offset-8">Perencanaan Pembelajaran Mendalam</span> yang Cepat, Akurat, dan Sesuai Kurikulum Merdeka.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => setView('settings')}
              className="bg-white text-indigo-950 px-16 py-7 rounded-[2rem] font-black text-2xl hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_25px_60px_rgba(8,112,184,0.4)] active:scale-95 flex items-center gap-5 mx-auto group"
            >
              MULAI SEKARANG
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <header className="bg-white/90 backdrop-blur-xl border-b py-5 no-print sticky top-0 z-50 shadow-sm px-8 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('landing')}>
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-indigo-100 shadow-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.822a.75.75 0 00-.788 0l-7 4.2a.75.75 0 000 1.288l7 4.2a.75.75 0 00.788 0l7-4.2a.75.75 0 000-1.288l-7-4.2z" />
              <path d="M18 9.25a.75.75 0 00-1.5 0v4.636l-5.467 3.28a.75.75 0 01-.766 0l-5.467-3.28V9.25a.75.75 0 00-1.5 0v4.636a2.25 2.25 0 001.15 1.955l5.467 3.28a3.75 3.75 0 003.834 0l5.466-3.28a2.25 2.25 0 001.15-1.955V9.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">GENERATOR RPM</h1>
            <p className="text-[10px] text-indigo-600 font-bold tracking-[0.2em] uppercase mt-1">Smart Academic Planner</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
           <button 
              onClick={() => setView('settings')}
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${view === 'settings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
           >
              IDENTITAS
           </button>
           <button 
              onClick={() => setView('generator')}
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${view === 'generator' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
           >
              GENERATOR
           </button>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-6 max-w-7xl py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-xl shadow-sm animate-in no-print">
            {error}
          </div>
        )}

        {view === 'settings' && (
           <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in duration-700">
              <div className="bg-indigo-700 p-12 text-white relative overflow-hidden">
                <h2 className="text-4xl font-black uppercase tracking-tighter relative z-10">Pengaturan Identitas</h2>
                <p className="text-indigo-100/70 text-lg mt-3 font-medium relative z-10">Informasi ini akan terintegrasi pada KOP dan administrasi RPM Anda.</p>
              </div>
              
              <div className="p-12 space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kepala Sekolah</label>
                       <input name="namaKepalaSekolah" value={formData.namaKepalaSekolah} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">NIP Kepala Sekolah</label>
                       <input name="nipKepalaSekolah" value={formData.nipKepalaSekolah} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Guru Mata Pelajaran</label>
                       <input name="namaGuru" value={formData.namaGuru} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">NIP Guru</label>
                       <input name="nipGuru" value={formData.nipGuru} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                 </div>

                 <div className="space-y-8 pt-10 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gaya KOP Surat</label>
                    <div className="grid grid-cols-3 gap-6">
                       {Object.values(KopType).map(t => (
                          <button key={t} onClick={() => setFormData(p => ({...p, kopType: t}))} className={`py-6 rounded-[2rem] border-2 font-black text-sm transition-all ${formData.kopType === t ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                            {t.toUpperCase()}
                          </button>
                       ))}
                    </div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat (Baris Bawah KOP)</label>
                       <textarea name="manualHeader" value={formData.manualHeader} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-medium h-24 outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    
                    {formData.kopType === KopType.Gambar && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                          <div className="space-y-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logo Instansi (Kiri)</span>
                             <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoProvinsi')} className="w-full text-xs" />
                             {formData.logoProvinsi && <img src={formData.logoProvinsi} className="h-20 object-contain mx-auto" />}
                          </div>
                          <div className="space-y-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logo Sekolah (Kanan)</span>
                             <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoSekolah')} className="w-full text-xs" />
                             {formData.logoSekolah && <img src={formData.logoSekolah} className="h-20 object-contain mx-auto" />}
                          </div>
                       </div>
                    )}
                 </div>

                 <button onClick={() => setView('generator')} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 text-xl">
                   SIMPAN & LANJUT
                 </button>
              </div>
           </div>
        )}

        {view === 'generator' && (
           <div className="animate-in duration-700">
             <div className="no-print mb-6">
                <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all text-sm group">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                   </svg>
                   KEMBALI KE BERANDA
                </button>
             </div>

             <form onSubmit={handleSubmit} className="no-print grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
               <div className="space-y-12">
                  <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 space-y-8">
                    <h3 className="text-2xl font-black text-indigo-700 uppercase tracking-tighter border-b pb-4 flex items-center gap-3">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                       Struktur Kurikulum
                    </h3>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400">Tahun Pelajaran</label>
                       <select name="tahunPelajaran" value={formData.tahunPelajaran} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                         {TAHUN_PELAJARAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400">Jenjang</label>
                           <select name="jenjang" value={formData.jenjang} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                             {Object.values(EducationLevel).map(v => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400">Fase</label>
                           <select name="fase" value={formData.fase} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                             {Object.values(Fase).map(v => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400">Kelas</label>
                          <select name="kelas" value={formData.kelas} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                            {getKelasOptions(formData.jenjang).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400">Semester</label>
                          <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                             {Object.values(Semester).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400">Durasi</label>
                       <input name="durasi" value={formData.durasi} onChange={handleInputChange} placeholder="Misal: 2 x 45 Menit" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400">Kesiapan Siswa (Opsional)</label>
                       <textarea name="kesiapanSiswa" value={formData.kesiapanSiswa} onChange={handleInputChange} placeholder="Gambarkan kesiapan awal siswa..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-24" />
                    </div>

                    <div className="space-y-4">
                       <label className="text-xs font-bold text-slate-400">Profil Lulusan (Multi-select)</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {DIMENSIONS.map(dim => (
                             <label key={dim} className={`flex items-center gap-3 p-3 rounded-xl border text-[10px] cursor-pointer transition-all ${formData.dimensiLulusan.includes(dim) ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" className="hidden" checked={formData.dimensiLulusan.includes(dim)} onChange={() => toggleMultiSelect('dimensiLulusan', dim)} />
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${formData.dimensiLulusan.includes(dim) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                   {formData.dimensiLulusan.includes(dim) && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                                </div>
                                {dim}
                             </label>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-12">
                  <div className="bg-white rounded-[1rem] shadow-xl border border-slate-200 p-8 space-y-6">
                    <h3 className="text-xl font-black text-indigo-800 uppercase tracking-tight flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                       DESAIN
                    </h3>

                    <input name="mapel" value={formData.mapel} onChange={handleInputChange} placeholder="Mata Pelajaran *" className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" />

                    <textarea 
                      name="tujuan" 
                      value={formData.tujuan} 
                      onChange={handleInputChange} 
                      placeholder="Tujuan Pembelajaran *" 
                      className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm h-32 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                    />

                    <input 
                      name="materi" 
                      value={formData.materi} 
                      onChange={handleInputChange} 
                      placeholder="Topik / Materi (Opsional)" 
                      className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        name="cp" 
                        value={formData.cp} 
                        onChange={handleInputChange} 
                        placeholder="Capaian Pemb. (Opsional)" 
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                      />
                      <input 
                        name="lintasMateri" 
                        value={formData.lintasMateri} 
                        onChange={handleInputChange} 
                        placeholder="Lintas Materi (Opsional)" 
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        name="kemitraan" 
                        value={formData.kemitraan} 
                        onChange={handleInputChange} 
                        placeholder="Kemitraan (Opsional)" 
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                      />
                      <input 
                        name="pemanfaatanDigitalInput" 
                        value={formData.pemanfaatanDigitalInput} 
                        onChange={handleInputChange} 
                        placeholder="Pemanfaatan Digital (Opsional)" 
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <select 
                      name="praktikPedagogis" 
                      value={formData.praktikPedagogis} 
                      onChange={handleInputChange} 
                      className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700"
                    >
                      <option value="" disabled>Pilih Model Pembelajaran *</option>
                      {Object.values(PedagogicalPractice).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>

                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-500">Metode *</label>
                       <div className="grid grid-cols-2 gap-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {METHODS.map(method => (
                             <label key={method} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={formData.metode.includes(method)} 
                                  onChange={() => toggleMultiSelect('metode', method)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                {method}
                             </label>
                          ))}
                       </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                       <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="ruangFisik" 
                            checked={formData.ruangFisik} 
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          Ruang Fisik
                       </label>
                       <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="ruangVirtual" 
                            checked={formData.ruangVirtual} 
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          Ruang Virtual
                       </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading} 
                      className={`w-full py-4 mt-6 rounded-md font-black text-white shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {loading ? "SEDANG MEMPROSES..." : "GENERATE RPM"}
                    </button>
                  </div>
               </div>
             </form>

             {loading && (
               <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white no-print">
                  <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h2 className="text-3xl font-black mb-4 animate-pulse uppercase tracking-widest">Generasi AI</h2>
                  <p className="text-lg font-medium text-indigo-100 italic text-center px-6">{LOADING_MESSAGES[loadingMsgIdx]}</p>
               </div>
             )}

             <div id="result">
               {rpmData && generated && <ResultTable data={rpmData} generated={generated} />}
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;