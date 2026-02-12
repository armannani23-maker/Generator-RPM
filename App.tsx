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

type AppView = 'landing' | 'settings' | 'generator';

const TAHUN_PELAJARAN_OPTIONS = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

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
    if (!formData.mapel || !formData.tujuan) {
      setError("Mohon isi Mata Pelajaran dan Tujuan Pembelajaran.");
      return;
    }

    setLoading(true);
    setError(null);
    setGenerated(null);

    try {
      const result = await generateRPMContent(formData);
      setGenerated(result);
      setRpmData(formData);
      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error("Submit Error:", err);
      setError(err.message || "Terjadi kesalahan saat menghubungi server AI.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-900 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-4xl animate-in z-10">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">RPM GENERATOR</h1>
          <p className="text-xl md:text-2xl font-light mb-12 text-indigo-100 italic opacity-80">"Transformasi Pembelajaran yang Lebih Mendalam & Bermakna"</p>
          <button 
            onClick={() => setView('settings')}
            className="bg-white text-indigo-950 px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95"
          >
            MULAI SEKARANG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <header className="bg-white border-b py-4 px-8 flex justify-between items-center no-print sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('landing')}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.822a.75.75 0 00-.788 0l-7 4.2a.75.75 0 000 1.288l7 4.2a.75.75 0 00.788 0l7-4.2a.75.75 0 000-1.288l-7-4.2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tighter">GENERATOR RPM</h1>
        </div>
        <nav className="flex gap-2">
          <button onClick={() => setView('settings')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Identitas</button>
          <button onClick={() => setView('generator')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'generator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Generator</button>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-6 py-10 max-w-7xl">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-4 animate-in shadow-sm">
             <div className="bg-red-500 text-white p-1 rounded-full flex-shrink-0 mt-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
             </div>
             <div>
               <p className="font-bold">Error Terdeteksi:</p>
               <p className="text-sm opacity-90">{error}</p>
             </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-4xl mx-auto space-y-10 animate-in border border-slate-100">
            <div className="flex items-center gap-4 border-b pb-6">
               <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               </div>
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800">Identitas Sekolah & Guru</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Satuan Pendidikan</label>
                <input name="satuanPendidikan" value={formData.satuanPendidikan} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat / Header Tambahan</label>
                <input name="manualHeader" value={formData.manualHeader} onChange={handleInputChange} placeholder="Jl. Alamat Sekolah..." className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kepala Sekolah</label>
                <input name="namaKepalaSekolah" value={formData.namaKepalaSekolah} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIP Kepala Sekolah</label>
                <input name="nipKepalaSekolah" value={formData.nipKepalaSekolah} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guru Mata Pelajaran</label>
                <input name="namaGuru" value={formData.namaGuru} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIP Guru</label>
                <input name="nipGuru" value={formData.nipGuru} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kustomisasi Logo (Opsional)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-[2rem]">
                 <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 block mb-2">Logo Kiri (Prov/Instansi)</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoProvinsi')} className="text-xs text-slate-500" />
                    {formData.logoProvinsi && <img src={formData.logoProvinsi} className="h-16 mt-2 object-contain" alt="Logo Kiri" />}
                 </div>
                 <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 block mb-2">Logo Kanan (Sekolah)</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoSekolah')} className="text-xs text-slate-500" />
                    {formData.logoSekolah && <img src={formData.logoSekolah} className="h-16 mt-2 object-contain" alt="Logo Kanan" />}
                 </div>
              </div>
            </div>

            <button onClick={() => setView('generator')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95">SIMPAN & LANJUTKAN</button>
          </div>
        )}

        {view === 'generator' && (
          <div className="space-y-12 animate-in pb-20">
            <form onSubmit={handleSubmit} className="space-y-10 no-print">
               {/* BARIS 1: ADMINISTRASI & STRUKTUR */}
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 space-y-8">
                 <div className="flex items-center gap-3 border-b pb-4">
                   <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Administrasi & Struktur</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Pelajaran</label>
                       <select name="tahunPelajaran" value={formData.tahunPelajaran} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">{TAHUN_PELAJARAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenjang</label>
                       <select name="jenjang" value={formData.jenjang} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">{Object.values(EducationLevel).map(v => <option key={v} value={v}>{v}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fase</label>
                       <select name="fase" value={formData.fase} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">{Object.values(Fase).map(v => <option key={v} value={v}>{v}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</label>
                       <select name="kelas" value={formData.kelas} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">{getKelasOptions(formData.jenjang).map(k => <option key={k} value={k}>{k}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</label>
                       <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">{Object.values(Semester).map(v => <option key={v} value={v}>{v}</option>)}</select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Pertemuan</label>
                       <input name="durasi" value={formData.durasi} onChange={handleInputChange} placeholder="Misal: 2 JP (2 x 45 Menit)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
                    </div>
                 </div>
               </div>

               {/* BARIS 2: KONTEN KURIKULUM */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 space-y-8 h-full">
                    <div className="flex items-center gap-3 border-b pb-4">
                       <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konten Kurikulum</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</label>
                        <input name="mapel" value={formData.mapel} onChange={handleInputChange} placeholder="Contoh: Matematika, Bahasa Inggris..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-300 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topik / Materi Pokok</label>
                        <input name="materi" value={formData.materi} onChange={handleInputChange} placeholder="Contoh: Turunan Fungsi, Recount Text..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-300 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capaian Pembelajaran (Opsional)</label>
                        <textarea name="cp" value={formData.cp} onChange={handleInputChange} placeholder="Copy paste elemen CP dari kurikulum..." className="w-full p-4 bg-slate-50 rounded-2xl font-medium border-2 border-transparent focus:border-indigo-300 outline-none h-24 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tujuan Pembelajaran (Wajib)</label>
                        <textarea name="tujuan" value={formData.tujuan} onChange={handleInputChange} placeholder="Apa yang ingin dicapai setelah pembelajaran ini?" className="w-full p-4 bg-slate-50 rounded-2xl font-medium border-2 border-transparent focus:border-indigo-300 outline-none h-32 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* BARIS 3: STRATEGI & PEDAGOGI */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 space-y-8 h-full">
                    <div className="flex items-center gap-3 border-b pb-4">
                       <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Strategi & Pedagogi</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Pembelajaran</label>
                        <select name="praktikPedagogis" value={formData.praktikPedagogis} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">
                          {Object.values(PedagogicalPractice).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembelajaran (Multi-select)</label>
                         <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl custom-scrollbar border-2 border-slate-100">
                            {METHODS.map(m => (
                               <label key={m} className={`flex items-center gap-3 p-2 rounded-xl text-[11px] cursor-pointer transition-all ${formData.metode.includes(m) ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>
                                  <input type="checkbox" className="hidden" checked={formData.metode.includes(m)} onChange={() => toggleMultiSelect('metode', m)} />
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${formData.metode.includes(m) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                     {formData.metode.includes(m) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                                  </div>
                                  {m}
                               </label>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lintas Materi (Opsional)</label>
                          <input name="lintasMateri" value={formData.lintasMateri} onChange={handleInputChange} placeholder="Kaitan dengan materi lain..." className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kemitraan (Opsional)</label>
                          <input name="kemitraan" value={formData.kemitraan} onChange={handleInputChange} placeholder="Industri/Praktisi..." className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none text-xs" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemanfaatan Digital</label>
                        <input name="pemanfaatanDigitalInput" value={formData.pemanfaatanDigitalInput} onChange={handleInputChange} placeholder="Platform yang digunakan (Canva, Quizizz, dll)..." className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none text-xs" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kesiapan Siswa (Profil Siswa)</label>
                        <textarea name="kesiapanSiswa" value={formData.kesiapanSiswa} onChange={handleInputChange} placeholder="Kondisi awal siswa saat ini..." className="w-full p-3 bg-slate-50 rounded-xl font-medium border-none outline-none text-xs h-16" />
                      </div>
                    </div>
                  </div>
               </div>

               {/* BARIS 4: PROFIL PELAJAR PANCASILA */}
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 space-y-8">
                  <div className="flex items-center gap-3 border-b pb-4">
                     <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </div>
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dimensi Profil Pelajar Pancasila</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {DIMENSIONS.map(dim => (
                        <label key={dim} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.dimensiLulusan.includes(dim) ? 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm font-bold' : 'bg-white border-slate-100 text-slate-500 hover:border-yellow-200'}`}>
                           <input type="checkbox" className="hidden" checked={formData.dimensiLulusan.includes(dim)} onChange={() => toggleMultiSelect('dimensiLulusan', dim)} />
                           <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.dimensiLulusan.includes(dim) ? 'bg-yellow-500 border-yellow-500' : 'bg-white border-slate-300'}`}>
                              {formData.dimensiLulusan.includes(dim) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                           </div>
                           <span className="text-[10px] leading-tight">{dim}</span>
                        </label>
                     ))}
                  </div>

                  <div className="pt-10 flex flex-col items-center">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className={`px-20 py-6 rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-4 ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1'}`}
                    >
                      {loading ? (
                         <>
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            MENYUSUN RPM...
                         </>
                      ) : (
                         <>
                            GENERATE HASIL RPM
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-4 font-bold tracking-widest uppercase italic">Pastikan data yang Anda masukkan sudah benar sebelum menekan tombol Generate.</p>
                  </div>
               </div>
            </form>

            {loading && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white no-print p-6">
                <div className="relative w-32 h-32 mb-10">
                   <div className="absolute inset-0 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-4 border-4 border-white/20 border-b-white/60 rounded-full animate-spin-slow"></div>
                </div>
                <h2 className="text-4xl font-black mb-4 animate-pulse uppercase tracking-[0.3em]">AI PROCESSING</h2>
                <p className="text-xl font-medium text-indigo-100 italic text-center max-w-lg">{LOADING_MESSAGES[loadingMsgIdx]}</p>
              </div>
            )}

            <div id="result">
               {generated && rpmData && <ResultTable data={rpmData} generated={generated} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;