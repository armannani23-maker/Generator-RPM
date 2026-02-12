
export enum EducationLevel {
  SD = 'SD',
  SMP = 'SMP',
  SMA = 'SMA',
  SMK = 'SMK'
}

export enum Fase {
  A = 'Fase A',
  B = 'Fase B',
  C = 'Fase C',
  D = 'Fase D',
  E = 'Fase E',
  F = 'Fase F'
}

export enum Semester {
  Ganjil = 'Ganjil',
  Genap = 'Genap'
}

export enum KopType {
  TanpaKop = 'Tanpa Kop',
  Manual = 'Manual',
  Gambar = 'Gambar'
}

export enum PedagogicalPractice {
  Inquiry = 'Inquiry-Discovery Learning',
  PjBL = 'Project Based Learning (PjBL)',
  ProblemSolving = 'Problem Based Learning',
  GameBased = 'Game Based Learning',
  Station = 'Station Learning'
}

export const DIMENSIONS = [
  'Keimanan dan ketaqwaan terhadap Tuhan YME',
  'Penalaran Kritis',
  'Kolaborasi',
  'Kesehatan',
  'Kemandirian',
  'Kreativitas',
  'Kewargaan',
  'Komunikasi'
];

export const METHODS = [
  'Ceramah Interaktif',
  'Diskusi Kelompok',
  'Demonstrasi',
  'Tanya Jawab',
  'Simulasi',
  'Studi Kasus',
  'Observasi',
  'Mind Mapping',
  'Debat',
  'Role Play'
];

export interface RPMData {
  satuanPendidikan: string;
  tahunPelajaran: string;
  namaGuru: string;
  nipGuru: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  jenjang: EducationLevel;
  fase: Fase;
  kelas: string;
  semester: Semester;
  mapel: string;
  cp: string;
  tujuan: string;
  materi: string;
  lintasMateri: string;
  kemitraan: string;
  pemanfaatanDigitalInput: string;
  durasi: string;
  kesiapanSiswa: string;
  praktikPedagogis: PedagogicalPractice;
  dimensiLulusan: string[];
  metode: string[];
  ruangFisik: boolean;
  ruangVirtual: boolean;
  logoSekolah?: string;
  logoProvinsi?: string;
  kopType: KopType;
  manualHeader?: string;
}

export interface GeneratedRPM {
  identifikasi: {
    pemetaanSiswa: string;
    karakteristikMateri: string;
    dimensiP5: string;
  };
  desain: {
    tujuanSpesifik: string;
    topik: string;
    lintasDisiplin: string;
  };
  pengalamanBelajar: {
    memahami: string;
    mengaplikasi: string;
    merefleksi: string;
    prinsipPedagogis: string; // Deskripsi mindful, meaningful, joyful
  };
  asesmen: {
    awal: string;
    proses: string;
    akhir: string;
    kisiKisi: string;
    instrumen: string;
    rubrik: string;
  };
  kemitraan: string;
  lkpd: {
    judul: string;
    tujuan: string;
    ringkasanMateri: string;
    aktivitas: {
      langkah: string;
      deskripsi: string;
    }[];
    pertanyaanEksploratif: string[];
    kesimpulanAktivitas: string;
  };
  tindakLanjut: {
    remedial: string;
    pengayaan: string;
  };
  bacaan: {
    guru: string;
    siswa: string;
  };
}
