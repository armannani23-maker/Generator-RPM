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
        table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; table-layout: fixed; border: 1pt solid black; }
        th, td { border: 1pt solid black; padding: 6pt; text-align: left; vertical-align: top; }
        .no-border { border: none !important; }
        .no-border td { border: none !important; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .section-break { page-break-after: always; margin-top: 30pt; }
        .title { font-size: 14pt; font-weight: bold; text-align: center; text-decoration: underline; margin-bottom: 15pt; }
      </style>
    `;

    const content = hiddenFullExportRef.current.innerHTML;
    const fullHtml = `
      <html>
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

  const renderHeaderHtml = (title: string) => (
    <div className="mb-6">
      {data.kopType !== KopType.TanpaKop && (
        <div className="border-b-[4.5pt] border-double border-black pb-2 mb-6">
          <table className="w-full no-border" style={{ border: 'none', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ border: 'none' }}>
                <td style={{ width: '15%', border: 'none', verticalAlign: 'middle', textAlign: 'left', padding: '0' }}>
                  {data.logoProvinsi && <img src={data.logoProvinsi} style={{ width: '85px', height: '85px', objectFit: 'contain' }} alt="Logo Prov" />}
                </td>
                <td className="text-center" style={{ width: '70%', border: 'none', verticalAlign: 'middle', padding: '0' }}>
                  <div className="flex flex-col items-center text-black">
                    <p className="font-bold text-[13pt] uppercase leading-[1.1] m-0">PEMERINTAH PROVINSI GORONTALO</p>
                    <p className="font-bold text-[12pt] uppercase leading-[1.1] m-0">DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
                    <p className="font-bold text-[16pt] uppercase leading-[1.1] my-1 tracking-tight">{data.satuanPendidikan}</p>
                    <p className="text-[9pt] italic m-0 font-normal leading-tight">{data.manualHeader}</p>
                  </div>
                </td>
                <td style={{ width: '15%', border: 'none', verticalAlign: 'middle', textAlign: 'right', padding: '0' }}>
                  {data.logoSekolah && <img src={data.logoSekolah} style={{ width: '85px', height: '85px', objectFit: 'contain' }} alt="Logo Sekolah" />}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className="font-bold text-[13pt] uppercase underline m-0">{title}</h3>
        <p className="text-[10pt] font-bold m-0 uppercase">TAHUN PELAJARAN {data.tahunPelajaran}</p>
      </div>
    </div>
  );

  const renderModulContent = () => (
    <div className="space-y-6">
      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center">I. KOMPONEN IDENTIFIKASI</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Pemetaan Siswa</td><td className="p-2 text-justify">{generated.identifikasi.pemetaanSiswa}</td></tr>
          <tr><td className="p-2 font-bold">Karakteristik Materi</td><td className="p-2 text-justify">{generated.identifikasi.karakteristikMateri}</td></tr>
          <tr><td className="p-2 font-bold">Profil Pelajar Pancasila</td><td className="p-2">{generated.identifikasi.dimensiP5}</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center">II. DESAIN PEMBELAJARAN</td></tr>
          <tr><td className="p-2 w-[200px] font-bold">Tujuan Pembelajaran</td><td className="p-2 text-justify">{generated.desain.tujuanSpesifik}</td></tr>
          <tr><td className="p-2 font-bold">Topik Utama</td><td className="p-2 font-bold uppercase">{generated.desain.topik}</td></tr>
          <tr><td className="p-2 font-bold">Lintas Disiplin</td><td className="p-2 text-justify">{generated.desain.lintasDisiplin}</td></tr>
          <tr><td className="p-2 font-bold">Kemitraan</td><td className="p-2 text-justify">{generated.kemitraan}</td></tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-[10.5pt]">
        <tbody>
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center">III. PENGALAMAN BELAJAR (3M)</td></tr>
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
          <tr className="bg-gray-100 font-bold uppercase"><td colSpan={2} className="p-2 text-center">IV. ASESMEN BERKELANJUTAN</td></tr>
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
    <table className="w-full mt-12 no-border" style={{ border: 'none' }}>
      <tbody>
        <tr style={{ border: 'none' }}>
          <td style={{ border: 'none', width: '50%' }}>
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

      {/* Render Table for View */}
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

      {/* Hidden container for FULL Export */}
      <div ref={hiddenFullExportRef} className="hidden">
        <div className="title">RENCANA PEMBELAJARAN MENDALAM (RPM)</div>
        {renderModulContent()}
        {renderAsesmenContent()}
        <div className="section-break"></div>
        <div className="title">LEMBAR KERJA PESERTA DIDIK (LKPD)</div>
        <div className="text-center font-bold mb-4">{generated.lkpd.judul}</div>
        <p><b>TUJUAN:</b> ${generated.lkpd.tujuan}</p>
        <p><b>RINGKASAN:</b> ${generated.lkpd.ringkasanMateri}</p>
        <table>
          <tr style={{background: '#eee'}}><td>No</td><td>Aktivitas</td><td>Deskripsi</td></tr>
          {generated.lkpd.aktivitas.map((a, i) => (
            <tr key={i}><td>{i+1}</td><td>{a.langkah}</td><td>{a.deskripsi}</td></tr>
          ))}
        </table>
        <div className="section-break"></div>
        <div className="title">BAHAN BACAAN & TINDAK LANJUT</div>
        <h3>Bacaan Guru:</h3><p>{generated.bacaan.guru}</p>
        <h3>Bacaan Siswa:</h3><p>{generated.bacaan.siswa}</p>
        <h3>Remedial:</h3><p>{generated.tindakLanjut.remedial}</p>
        <h3>Pengayaan:</h3><p>{generated.tindakLanjut.pengayaan}</p>
        {renderSignatures()}
      </div>
    </div>
  );
};

export default ResultTable;