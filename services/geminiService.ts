import { GoogleGenAI, Type } from "@google/genai";
import { RPMData, GeneratedRPM } from "../types";

const cleanJsonString = (input: string): string => {
  let cleaned = input.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  }
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned.trim();
};

// Fungsi untuk memastikan data tidak null agar tidak terjadi error di UI
const validateAndFillMissing = (data: any): GeneratedRPM => {
  const fallback = {
    identifikasi: { pemetaanSiswa: "-", karakteristikMateri: "-", dimensiP5: "-" },
    desain: { tujuanSpesifik: "-", topik: "-", lintasDisiplin: "-" },
    pengalamanBelajar: { memahami: "-", mengaplikasi: "-", merefleksi: "-", prinsipPedagogis: "-" },
    asesmen: { awal: "-", proses: "-", akhir: "-", kisiKisi: "-", instrumen: "-", rubrik: "-" },
    kemitraan: "-",
    lkpd: { judul: "-", tujuan: "-", ringkasanMateri: "-", aktivitas: [], pertanyaanEksploratif: [], kesimpulanAktivitas: "-" },
    tindakLanjut: { remedial: "-", pengayaan: "-" },
    bacaan: { guru: "-", siswa: "-" }
  };

  return {
    ...fallback,
    ...data,
    identifikasi: { ...fallback.identifikasi, ...data.identifikasi },
    desain: { ...fallback.desain, ...data.desain },
    pengalamanBelajar: { ...fallback.pengalamanBelajar, ...data.pengalamanBelajar },
    asesmen: { ...fallback.asesmen, ...data.asesmen },
    lkpd: { ...fallback.lkpd, ...data.lkpd },
    tindakLanjut: { ...fallback.tindakLanjut, ...data.tindakLanjut },
    bacaan: { ...fallback.bacaan, ...data.bacaan }
  };
};

export const generateRPMContent = async (data: RPMData): Promise<GeneratedRPM> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY tidak ditemukan. Pastikan Anda sudah menambahkannya di Environment Variables Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Bertindaklah sebagai Konsultan Kurikulum Merdeka Senior. Buatlah Rencana Pembelajaran Mendalam (RPM) yang KOMPREHENSIF untuk:
    - Sekolah: ${data.satuanPendidikan}
    - Mata Pelajaran: ${data.mapel}
    - Jenjang/Kelas/Semester: ${data.jenjang} / ${data.kelas} / ${data.semester}
    - Tujuan Pembelajaran Utama: ${data.tujuan}
    - Model Pembelajaran: ${data.praktikPedagogis}
    - Metode: ${data.metode.join(", ")}
    - Profil Pelajar Pancasila: ${data.dimensiLulusan.join(", ")}

    SYARAT OUTPUT:
    1. Harus dalam format JSON murni.
    2. Gunakan Bahasa Indonesia yang sangat profesional dan inspiratif.
    3. Pada bagian pengalamanBelajar, jelaskan langkah konkret yang mencerminkan prinsip "Mindful, Meaningful, Joyful".
    4. Pada bagian asesmen, berikan kisi-kisi soal dan rubrik penilaian yang jelas.
    5. LKPD harus berisi setidaknya 3 aktivitas eksploratif.

    STRUKTUR JSON YANG DIWAJIBKAN:
    {
      "identifikasi": { "pemetaanSiswa": "...", "karakteristikMateri": "...", "dimensiP5": "..." },
      "desain": { "tujuanSpesifik": "...", "topik": "...", "lintasDisiplin": "..." },
      "pengalamanBelajar": { "memahami": "...", "mengaplikasi": "...", "merefleksi": "...", "prinsipPedagogis": "..." },
      "asesmen": { "awal": "...", "proses": "...", "akhir": "...", "kisiKisi": "...", "instrumen": "...", "rubrik": "..." },
      "kemitraan": "...",
      "lkpd": { "judul": "...", "tujuan": "...", "ringkasanMateri": "...", "aktivitas": [{"langkah": "...", "deskripsi": "..."}], "pertanyaanEksploratif": ["..."], "kesimpulanAktivitas": "..." },
      "tindakLanjut": { "remedial": "...", "pengayaan": "..." },
      "bacaan": { "guru": "...", "siswa": "..." }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifikasi: {
              type: Type.OBJECT,
              properties: {
                pemetaanSiswa: { type: Type.STRING },
                karakteristikMateri: { type: Type.STRING },
                dimensiP5: { type: Type.STRING }
              },
              required: ["pemetaanSiswa", "karakteristikMateri", "dimensiP5"]
            },
            desain: {
              type: Type.OBJECT,
              properties: {
                tujuanSpesifik: { type: Type.STRING },
                topik: { type: Type.STRING },
                lintasDisiplin: { type: Type.STRING }
              },
              required: ["tujuanSpesifik", "topik", "lintasDisiplin"]
            },
            pengalamanBelajar: {
              type: Type.OBJECT,
              properties: {
                memahami: { type: Type.STRING },
                mengaplikasi: { type: Type.STRING },
                merefleksi: { type: Type.STRING },
                prinsipPedagogis: { type: Type.STRING }
              },
              required: ["memahami", "mengaplikasi", "merefleksi", "prinsipPedagogis"]
            },
            asesmen: {
              type: Type.OBJECT,
              properties: {
                awal: { type: Type.STRING },
                proses: { type: Type.STRING },
                akhir: { type: Type.STRING },
                kisiKisi: { type: Type.STRING },
                instrumen: { type: Type.STRING },
                rubrik: { type: Type.STRING }
              },
              required: ["awal", "proses", "akhir", "kisiKisi", "instrumen", "rubrik"]
            },
            kemitraan: { type: Type.STRING },
            lkpd: {
              type: Type.OBJECT,
              properties: {
                judul: { type: Type.STRING },
                tujuan: { type: Type.STRING },
                ringkasanMateri: { type: Type.STRING },
                aktivitas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      langkah: { type: Type.STRING },
                      deskripsi: { type: Type.STRING }
                    },
                    required: ["langkah", "deskripsi"]
                  }
                },
                pertanyaanEksploratif: { type: Type.ARRAY, items: { type: Type.STRING } },
                kesimpulanAktivitas: { type: Type.STRING }
              },
              required: ["judul", "tujuan", "ringkasanMateri", "aktivitas", "pertanyaanEksploratif", "kesimpulanAktivitas"]
            },
            tindakLanjut: {
              type: Type.OBJECT,
              properties: {
                remedial: { type: Type.STRING },
                pengayaan: { type: Type.STRING }
              },
              required: ["remedial", "pengayaan"]
            },
            bacaan: {
              type: Type.OBJECT,
              properties: {
                guru: { type: Type.STRING },
                siswa: { type: Type.STRING }
              },
              required: ["guru", "siswa"]
            }
          },
          required: ["identifikasi", "desain", "pengalamanBelajar", "asesmen", "lkpd", "tindakLanjut", "bacaan"]
        }
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("AI memberikan respons kosong.");
    const cleanedText = cleanJsonString(rawText);
    const parsedData = JSON.parse(cleanedText);
    
    return validateAndFillMissing(parsedData);
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    throw new Error(error.message || "Gagal memproses data AI.");
  }
};