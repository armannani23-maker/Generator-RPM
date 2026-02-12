import { GoogleGenAI, Type } from "@google/genai";
import { RPMData, GeneratedRPM } from "../types";

const cleanJsonString = (input: string): string => {
  let cleaned = input.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  }
  return cleaned.trim();
};

export const generateRPMContent = async (data: RPMData): Promise<GeneratedRPM> => {
  // Use a new instance of GoogleGenAI for each request to ensure the latest API key from process.env.API_KEY is used.
  // The API key is assumed to be available and valid in the execution environment.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Buatlah Rencana Pembelajaran Mendalam (RPM) profesional dengan komponen utama:
    1. Identifikasi: Pemetaan pengetahuan awal, karakteristik materi, dan dimensi P5.
    2. Desain Pembelajaran: Tujuan spesifik, topik, dan integrasi lintas disiplin.
    3. Pengalaman Belajar (Siklus 3M): Memahami, Mengaplikasi, Merefleksi. Harus mencerminkan prinsip: Mindful (berkesadaran), Meaningful (bermakna), dan Joyful (menggembirakan).
    4. Asesmen: Diagnostik (Awal), Formatif (Proses), dan Sumatif (Akhir).
    5. Kemitraan & LKPD & Bacaan & Tindak Lanjut.

    Data Input:
    - Sekolah: ${data.satuanPendidikan}
    - Mapel: ${data.mapel}
    - Jenjang/Fase: ${data.jenjang} / ${data.fase}
    - CP: ${data.cp}
    - TP: ${data.tujuan}
    - Model: ${data.praktikPedagogis}
    - Metode: ${data.metode.join(", ")}
    - Profil P5: ${data.dimensiLulusan.join(", ")}

    OUTPUT HARUS JSON VALID. Jangan tambahkan teks lain.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
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
                      deskripsi: { type: Type.STRING } // Use 'deskripsi' to match the UI and interface
                    }
                  }
                },
                pertanyaanEksploratif: { type: Type.ARRAY, items: { type: Type.STRING } },
                kesimpulanAktivitas: { type: Type.STRING }
              }
            },
            tindakLanjut: {
              type: Type.OBJECT,
              properties: {
                remedial: { type: Type.STRING },
                pengayaan: { type: Type.STRING }
              }
            },
            bacaan: {
              type: Type.OBJECT,
              properties: {
                guru: { type: Type.STRING },
                siswa: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    // Access the generated text directly from the response.text property.
    const rawText = response.text;
    if (!rawText) throw new Error("AI tidak memberikan respon.");
    const cleanedText = cleanJsonString(rawText);
    return JSON.parse(cleanedText) as GeneratedRPM;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Gagal memproses data AI.");
  }
};