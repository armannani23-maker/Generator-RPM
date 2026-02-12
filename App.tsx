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
      // Scroll ke hasil
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-900 p-6 text-white text-center">
        <div className="max-w-4xl animate-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">RPM GENERATOR</h1>
          <p className="text-xl md:text-2xl font-light mb-12 text-indigo-100 italic opacity-80">"Transformasi Pembelajaran yang Lebih Mendalam & Bermakna"</p>
          <button 
            onClick={() => setView('settings')}
            className="bg-white text-indigo-950 px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl"
          >
            MULAI SEKARANG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b py-4 px-8 flex justify-between items-center no-print sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.822a.75.75 0 00-.788 0l-7 4.2a.75.75 0 000 1.288l7 4.2a.75.75 0 00.788 0l7-4.2a.75.75 0 000-1.288l-7-4.2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tighter">GENERATOR RPM</h1>
        </div>
        <nav className="flex gap-4">
          <button onClick={() => setView('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'settings' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>Identitas</button>
          <button onClick={() => setView('generator')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'generator' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>Generator</button>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-4 animate-in">
             <div className="bg-red-500 text-white p-1 rounded-full flex-shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
             </div>
             <div>
               <p className="font-bold">Error Terdeteksi:</p>
               <p className="text-sm opacity-90">{error}</p>
               <p className="text-xs mt-2 italic">*Jika Anda developer, pastikan API_KEY sudah diset di Vercel Dashboard.</p>
             </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-3xl mx-auto space-y-8 animate-in">
            <h2 className="text-3xl font-black uppercase tracking-tight text-indigo-900 border-b pb-4">Pengaturan Identitas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Nama Sekolah</label>
                <input name="satuanPendidikan" value={formData.satuanPendidikan} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-xl font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Tahun Pelajaran</label>
                <select name="tahunPelajaran" value={formData.tahunPelajaran} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-xl font-bold">
                  {TAHUN_PELAJARAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase">Kepala Sekolah</label>
                 <input name="namaKepalaSekolah" value={formData.namaKepalaSekolah} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-xl font-bold focus:border-indigo-500 outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase">Nama Guru</label>
                 <input name="namaGuru" value={formData.namaGuru} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-xl font-bold focus:border-indigo-500 outline-none" />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Alamat Sekolah</label>
              <textarea name="manualHeader" value={formData.manualHeader} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-xl font-medium focus:border-indigo-500 outline-none h-20" />
            </div>
            <button onClick={() => setView('generator')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">SIMPAN & LANJUTKAN</button>
          </div>
        )}

        {view === 'generator' && (
          <div className="space-y-12 animate-in">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10 no-print">
               <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                 <h3 className="text-xl font-black text-indigo-700 uppercase border-b pb-3">Data Kurikulum</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <select name="jenjang" value={formData.jenjang} onChange={handleInputChange} className="p-3 bg-slate-50 rounded-xl font-bold border-none">{Object.values(EducationLevel).map(v => <option key={v} value={v}>{v}</option>)}</select>
                    <select name="semester" value={formData.semester} onChange={handleInputChange} className="p-3 bg-slate-50 rounded-xl font-bold border-none">{Object.values(Semester).map(v => <option key={v} value={v}>{v}</option>)}</select>
                 </div>
                 <input name="mapel" value={formData.mapel} onChange={handleInputChange} placeholder="Mata Pelajaran *" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-indigo-300 outline-none" />
                 <textarea name="tujuan" value={formData.tujuan} onChange={handleInputChange} placeholder="Tujuan Pembelajaran Utama *" className="w-full p-4 bg-slate-50 rounded-xl font-medium border-2 border-transparent focus:border-indigo-300 outline-none h-32" />
               </div>

               <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                 <h3 className="text-xl font-black text-indigo-700 uppercase border-b pb-3">Model & Metode</h3>
                 <select name="praktikPedagogis" value={formData.praktikPedagogis} onChange={handleInputChange} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none">
                   {Object.values(PedagogicalPractice).map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">Metode Pembelajaran (Multi)</label>
                    <div className="grid grid-cols-2 gap-2 h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl custom-scrollbar">
                      {METHODS.map(m => (
                        <label key={m} className="flex items-center gap-2 text-xs p-1 hover:bg-white rounded cursor-pointer">
                          <input type="checkbox" checked={formData.metode.includes(m)} onChange={() => toggleMultiSelect('metode', m)} />
                          {m}
                        </label>
                      ))}
                    </div>
                 </div>
                 <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${loading ? 'bg-slate-300 text-slate-500' : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'}`}>
                   {loading ? "MENYUSUN RPM..." : "GENERATE HASIL RPM"}
                 </button>
               </div>
            </form>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse no-print">
                <div className="w-20 h-20 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <p className="text-2xl font-black text-indigo-900 uppercase tracking-widest">{LOADING_MESSAGES[loadingMsgIdx]}</p>
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