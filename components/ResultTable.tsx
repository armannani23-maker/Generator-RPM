import React, { useRef, useState } from 'react';
import { RPMData, GeneratedRPM, KopType } from '../types';

interface Props {
  data: RPMData;
  generated: GeneratedRPM;
}

type TabType = 'Modul' | 'LKPD' | 'Asesmen' | 'Bacaan' | 'Tindak Lanjut';

const ResultTable: React.FC<Props> = ({ data, generated }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const hiddenFullExportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Modul');

  const handleCopyAndGo = async () => {
    if (!tableRef.current) return;
    try {
      const htmlContent = tableRef.current.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const dataItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([dataItem]);
      alert("Konten tab aktif telah disalin! Silakan 'Paste' di Google Dokumen.");
      window.open('https://docs.google.com/document/create', '_blank');
    } catch (err) {
      const textContent = tableRef.current.innerText;
      await navigator.clipboard.writeText(textContent);
      window.open('https://docs.google.com/document/create', '_blank');
    }
  };

  const handleExportDocx = () => {
    if (!hiddenFullExportRef.current) return;
    
    const styles = `
      <style>
        @page { size: A4; margin: 1.5cm 1.5cm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.3; color: #000; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; border: 1pt solid black; }
        th, td { border: 1pt solid black; padding: 6pt; text-align: left; vertical-align: top; }
        .no-border { border: none !important; }
        .no-border td { border: none !important; padding: 0 !important; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .section-break { page-break-after: always; margin-top: 30pt; }
        .title-container { text-align: center; margin-bottom: 20pt; }
        .kop-table { width: 100%; border: none !important; border-bottom: 4pt double black !important; margin-bottom: 15pt; }
        .kop-table td { border: none !important; padding: 2pt !important; vertical-align: middle; }
        .logo-img { width: 80px; height: 80px; }
        .header-text { text-align: center; }
      </style>
    `;

    const content = hiddenFullExportRef.current.innerHTML;
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          ${styles}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RPM_LENGKAP_${data.mapel.replace(/ /g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper untuk merender KOP Surat yang bisa digunakan di preview & export
  const renderKopSurat = () => {
    if (data.kopType === KopType.TanpaKop) return null;
    return (
      <div className="border-b-[4.5pt] border-double border-black pb-2 mb-6 kop-container">
        <table className="w-full no-border kop-table" style={{ border: 'none', borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr style={{ border: 'none' }}>
              <td style={{ width: '15%', border: 'none', textAlign: 'left', padding: '0' }}>
                {data.logoProvinsi && <img src={data.logoProvinsi} className="logo-img" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo Prov" />}
              </td>
              <td className="text-center header-text" style={{ width: '70%', border: 'none', padding: '0' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', margin: '0', lineHeight: '1.2' }}>PEMERINTAH PROVINSI GORONTALO</p>
                  <p style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', margin: '0', lineHeight: '1.2' }}>DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                  <p style={{ fontWeight: 'bold', fontSize: '16pt', textTransform: 'uppercase', margin: '4pt 0', lineHeight: '1.1' }}>{data.satuanPendidikan}</p>
                  <p style={{ fontSize: '9pt', fontStyle: 'italic', margin: '0', fontWeight: 'normal' }}>{data.manualHeader}</p>
                </div>
              </td>
              <td style={{ width: '15%', border: 'none', textAlign: 'right', padding: '0' }}>
                {data.logoSekolah && <img src={data.logoSekolah} className="logo-img" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo Sekolah" />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderHeaderHtml = (title: string) => (
    <div className="mb-6">
      {renderKopSurat()}
      <div className="text-center mb-8 title-container">
        <h3 className="font-bold text-[13pt] uppercase underline m-0">{title}</h3>
        <p className="text-[10pt] font-bold m-0 uppercase">TAHUN PELAJARAN {data.tahunPelajaran}</p>
      </div>
    </div>
  );

  const renderModulContent = () => (
    <div className="space-y-6">
      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#f3f4f6' }}>I. KOMPONEN IDENTIFIKASI</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Pemetaan Siswa</td><td className="p-2 text-justify">{generated.identifikasi.pemetaanSiswa}</td></tr>
          <tr><td className="p-2 font-bold">Karakteristik Materi</td><td className="p-2 text-justify">{generated.identifikasi.karakteristikMateri}</td></tr>
          <tr><td className="p-2 font-bold">Profil Pelajar Pancasila</td><td className="p-2">{generated.identifikasi.dimensiP5}</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#f3f4f6' }}>II. DESAIN PEMBELAJARAN</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Tujuan Pembelajaran</td><td className="p-2 text-justify">{generated.desain.tujuanSpesifik}</td></tr>
          <tr><td className="p-2 font-bold">Topik Utama</td><td className="p-2 font-bold uppercase">{generated.desain.topik}</td></tr>
          <tr><td className="p-2 font-bold">Lintas Disiplin</td><td className="p-2 text-justify">{generated.desain.lintasDisiplin}</td></tr>
          <tr><td className="p-2 font-bold">Kemitraan</td><td className="p-2 text-justify">{generated.kemitraan}</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#f3f4f6' }}>III. PENGALAMAN BELAJAR (3M)</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Memahami (Understanding)</td><td className="p-2 text-justify">{generated.pengalamanBelajar.memahami}</td></tr>
          <tr><td className="p-2 font-bold">Mengaplikasi (Applying)</td><td className="p-2 text-justify">{generated.pengalamanBelajar.mengaplikasi}</td></tr>
          <tr><td className="p-2 font-bold">Merefleksi (Reflecting)</td><td className="p-2 text-justify">{generated.pengalamanBelajar.merefleksi}</td></tr>
          <tr className="bg-indigo-50 italic"><td className="p-2 font-bold">Filosofi 3M</td><td className="p-2 text-[9.5pt]">{generated.pengalamanBelajar.prinsipPedagogis}</td></tr>
        </tbody>
      </table>
    </div>
  );

  const renderAsesmenContent = () => (
    <div className="space-y-6">
      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#f3f4f6' }}>IV. ASESMEN BERKELANJUTAN</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Diagnostik (Awal)</td><td className="p-2">{generated.asesmen.awal}</td></tr>
          <tr><td className="p-2 font-bold">Formatif (Proses)</td><td className="p-2">{generated.asesmen.proses}</td></tr>
          <tr><td className="p-2 font-bold">Sumatif (Akhir)</td><td className="p-2">{generated.asesmen.akhir}</td></tr>
        </tbody>
      </table>
      <div className="border border-black p-4 text-[10pt]">
        <h4 className="font-bold underline mb-2 uppercase">Kisi-kisi & Instrumen:</h4>
        <p className="whitespace-pre-wrap">{generated.asesmen.kisiKisi}</p>
        <p className="mt-4 whitespace-pre-wrap">{generated.asesmen.instrumen}</p>
        <h4 className="font-bold underline mt-4 mb-2 uppercase">Rubrik Penilaian:</h4>
        <p className="whitespace-pre-wrap">{generated.asesmen.rubrik}</p>
      </div>
    </div>
  );

  const renderSignatures = () => (
    <table className="w-full mt-12 no-border" style={{ border: 'none', width: '100%' }}>
      <tbody>
        <tr style={{ border: 'none' }}>
          <td style={{ border: 'none', width: '50%', textAlign: 'left' }}>
            <p className="m-0">Mengetahui,</p>
            <p className="m-0 mb-20">Kepala Sekolah</p>
            <br /><br /><br />
            <p className="font-bold underline uppercase m-0">{data.namaKepalaSekolah}</p>
            <p className="m-0">NIP. {data.nipKepalaSekolah}</p>
          </td>
          <td style={{ border: 'none', width: '50%', textAlign: 'right' }}>
            <p className="m-0">Gorontalo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="m-0 mb-20">Guru Mata Pelajaran</p>
            <br /><br /><br />
            <p className="font-bold underline uppercase m-0">{data.namaGuru}</p>
            <p className="m-0">NIP. {data.nipGuru}</p>
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="mt-12 pb-20 animate-in">
      {/* Tab Navigasi */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-sm p-3 mb-8 flex items-center justify-between no-print sticky top-24 z-40 overflow-x-auto mx-4">
        <div className="flex items-center gap-1">
           {(['Modul', 'LKPD', 'Asesmen', 'Bacaan', 'Tindak Lanjut'] as TabType[]).map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {t}
              </button>
           ))}
        </div>
        <div className="flex items-center gap-2 border-l pl-4">
           <button onClick={handleCopyAndGo} className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border border-slate-200 text-slate-600 hover:border-black transition-all">
              Copy G-Docs
           </button>
           <button onClick={handleExportDocx} className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase bg-black text-white hover:bg-slate-800 transition-all shadow-lg">
              Download Full (.doc)
           </button>
        </div>
      </div>

      {/* Render Table for View (Preview) */}
      <div ref={tableRef} className="bg-white p-[1in] shadow-2xl rounded-sm border print:shadow-none print:p-0 min-h-[11.69in] max-w-[8.27in] mx-auto text-black selection:bg-indigo-100 overflow-hidden">
        {renderHeaderHtml(activeTab === 'Modul' ? 'Rencana Pembelajaran Mendalam (RPM)' : activeTab === 'LKPD' ? 'Lembar Kerja Peserta Didik (LKPD)' : activeTab === 'Asesmen' ? 'Instrumen Asesmen' : activeTab === 'Bacaan' ? 'Bahan Bacaan Literasi' : 'Tindak Lanjut')}
        
        {activeTab === 'Modul' && renderModulContent()}
        {activeTab === 'Asesmen' && renderAsesmenContent()}
        
        {activeTab === 'LKPD' && (
          <div className="space-y-6">
            <div className="border-2 border-black p-4 text-center bg-gray-50 font-bold uppercase text-[12pt]">{generated.lkpd.judul}</div>
            <table className="w-full border border-black text-[10.5pt]">
              <tbody>
                <tr><td className="w-1/4 font-bold p-2 uppercase">Tujuan</td><td className="p-2 italic">{generated.lkpd.tujuan}</td></tr>
                <tr><td className="font-bold p-2 uppercase">Ringkasan</td><td className="p-2 text-justify">{generated.lkpd.ringkasanMateri}</td></tr>
              </tbody>
            </table>
            <p className="font-bold uppercase border-b-2 border-black pb-1 mt-6">A. Langkah Kerja</p>
            <table className="w-full border border-black text-[10.5pt]">
              <thead><tr className="bg-gray-100 font-bold"><td className="w-10 p-2 text-center border border-black">No</td><td className="p-2 border border-black">Aktivitas</td><td className="p-2 border border-black">Deskripsi</td></tr></thead>
              <tbody>
                {generated.lkpd.aktivitas.map((a, i) => (
                  <tr key={i}><td className="text-center p-2 border border-black">{i+1}</td><td className="p-2 font-bold border border-black">{a.langkah}</td><td className="p-2 border border-black">{a.deskripsi}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="font-bold uppercase border-b-2 border-black pb-1 mt-8">B. Pertanyaan Eksploratif</p>
            <div className="space-y-6 mt-4">
              {generated.lkpd.pertanyaanEksploratif.map((q, i) => (
                <div key={i} className="mb-4"><p className="font-bold">{i+1}. {q}</p><div className="border border-gray-300 h-16 w-full mt-2"></div></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Bacaan' && (
          <div className="space-y-6 text-[10.5pt]">
            <div className="border border-black p-4">
               <h4 className="font-bold border-b border-black mb-2 uppercase">A. Bacaan Guru</h4>
               <p className="whitespace-pre-wrap">{generated.bacaan.guru}</p>
            </div>
            <div className="border border-black p-4">
               <h4 className="font-bold border-b border-black mb-2 uppercase">B. Bacaan Siswa</h4>
               <p className="whitespace-pre-wrap">{generated.bacaan.siswa}</p>
            </div>
          </div>
        )}

        {activeTab === 'Tindak Lanjut' && (
          <div className="space-y-6 text-[10.5pt]">
            <div className="border border-black p-4">
               <h4 className="font-bold border-b border-black mb-2 uppercase text-red-700">Program Remedial</h4>
               <p className="whitespace-pre-wrap italic">{generated.tindakLanjut.remedial}</p>
            </div>
            <div className="border border-black p-4">
               <h4 className="font-bold border-b border-black mb-2 uppercase text-green-700">Program Pengayaan</h4>
               <p className="whitespace-pre-wrap italic">{generated.tindakLanjut.pengayaan}</p>
            </div>
          </div>
        )}

        {renderSignatures()}
      </div>

      {/* Hidden container for FULL Export (Lengkap dengan KOP untuk setiap section) */}
      <div ref={hiddenFullExportRef} className="hidden">
        {/* Modul Section */}
        {renderHeaderHtml('Rencana Pembelajaran Mendalam (RPM)')}
        {renderModulContent()}
        <div className="section-break"></div>

        {/* Asesmen Section */}
        {renderHeaderHtml('Instrumen Asesmen')}
        {renderAsesmenContent()}
        <div className="section-break"></div>

        {/* LKPD Section */}
        {renderHeaderHtml('Lembar Kerja Peserta Didik (LKPD)')}
        <div style={{ textAlign: 'center', border: '2pt solid black', padding: '10pt', backgroundColor: '#f9fafb', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15pt' }}>
          {generated.lkpd.judul}
        </div>
        <table border={1} style={{ width: '100%', marginBottom: '15pt' }}>
          <tr><td style={{ fontWeight: 'bold', width: '20%' }}>Tujuan</td><td>{generated.lkpd.tujuan}</td></tr>
          <tr><td style={{ fontWeight: 'bold' }}>Ringkasan</td><td>{generated.lkpd.ringkasanMateri}</td></tr>
        </table>
        <h4 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black', paddingBottom: '3pt' }}>A. Langkah Kerja</h4>
        <table border={1} style={{ width: '100%' }}>
          <tr style={{ backgroundColor: '#eeeeee', fontWeight: 'bold' }}>
            <td style={{ width: '30pt', textAlign: 'center' }}>No</td>
            <td>Aktivitas</td>
            <td>Deskripsi</td>
          </tr>
          {generated.lkpd.aktivitas.map((a, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td style={{ fontWeight: 'bold' }}>{a.langkah}</td>
              <td>{a.deskripsi}</td>
            </tr>
          ))}
        </table>
        <h4 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black', paddingBottom: '3pt', marginTop: '20pt' }}>B. Pertanyaan Eksploratif</h4>
        {generated.lkpd.pertanyaanEksploratif.map((q, i) => (
          <div key={i} style={{ marginBottom: '15pt' }}>
            <p><b>{i + 1}. {q}</b></p>
            <div style={{ border: '1pt solid #ccc', height: '50pt', width: '100%' }}></div>
          </div>
        ))}
        <div className="section-break"></div>

        {/* Bacaan & Tindak Lanjut Section */}
        {renderHeaderHtml('Bahan Bacaan & Tindak Lanjut')}
        <h3 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black' }}>Bacaan Guru:</h3>
        <p>{generated.bacaan.guru}</p>
        <h3 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black' }}>Bacaan Siswa:</h3>
        <p>{generated.bacaan.siswa}</p>
        <h3 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black', color: '#b91c1c' }}>Program Remedial:</h3>
        <p><i>{generated.tindakLanjut.remedial}</i></p>
        <h3 style={{ textTransform: 'uppercase', borderBottom: '1pt solid black', color: '#15803d' }}>Program Pengayaan:</h3>
        <p><i>{generated.tindakLanjut.pengayaan}</i></p>

        {renderSignatures()}
      </div>
    </div>
  );
};

export default ResultTable;