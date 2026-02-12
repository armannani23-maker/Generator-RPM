import { GoogleGenAI, Type } from "@google/genai";
import { RPMData, GeneratedRPM } from "../types";

const cleanJsonString = (input: string): string => {
  let cleaned = input.trim();
  // Menghilangkan pembungkus markdown code block jika ada
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  }
  // Mencari karakter awal { dan akhir } untuk memastikan validitas JSON
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned.trim();
};

export const generateRPMContent = async (data: RPMData): Promise<GeneratedRPM> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY tidak ditemukan. Pastikan Anda sudah menambahkannya di Environment Variables Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Bertindaklah sebagai Ahli Kurikulum Merdeka. Buatlah Rencana Pembelajaran Mendalam (RPM) yang sangat lengkap untuk:
    - Sekolah: ${data.satuanPendidikan}
    - Mata Pelajaran: ${data.mapel}
    - Kelas/Semester: ${data.kelas} / ${data.semester}
    - Tujuan Pembelajaran: ${data.tujuan}
    - Model: ${data.praktikPedagogis}
    - Metode: ${data.metode.join(", ")}
    - Profil Pelajar Pancasila: ${data.dimensiLulusan.join(", ")}

    KOMPONEN WAJIB (JSON):
    1. identifikasi: pemetaanSiswa, karakteristikMateri, dimensiP5.
    2. desain: tujuanSpesifik, topik (JUDUL BESAR), lintasDisiplin.
    3. pengalamanBelajar: memahami, mengaplikasi, merefleksi, prinsipPedagogis (penjelasan 3M).
    4. asesmen: awal, proses, akhir, kisiKisi, instrumen, rubrik.
    5. kemitraan: string.
    6. lkpd: judul, tujuan, ringkasanMateri, aktivitas (array: langkah, deskripsi), pertanyaanEksploratif (array string), kesimpulanAktivitas.
    7. tindakLanjut: remedial, pengayaan.
    8. bacaan: guru, siswa.

    Pastikan bahasa yang digunakan profesional dan inspiratif.
    PENTING: JANGAN BERIKAN TEKS PEMBUKA/PENUTUP. HANYA JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
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
          }
        }
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("AI memberikan respons kosong.");
    const cleanedText = cleanJsonString(rawText);
    const parsedData = JSON.parse(cleanedText);
    
    // Validasi data minimal
    if (!parsedData.identifikasi || !parsedData.lkpd) {
      throw new Error("Struktur data hasil AI tidak lengkap.");
    }

    return parsedData as GeneratedRPM;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("Konfigurasi API_KEY tidak valid. Silakan cek Vercel Settings.");
    }
    throw new Error(error.message || "Gagal memproses data AI.");
  }
};