import {
  getSubKegiatanData as fetchSubKegiatan,
  saveSubKegiatanData as persistSubKegiatan,
  saveOneSubKegiatan,
  deleteSubKegiatanById,
} from './supabaseDataStore';
import type { SubKegiatan } from './supabaseDataStore';

export type { SubKegiatan };

// In-memory cache for synchronous access (populated on first async load)
let cachedData: SubKegiatan[] | null = null;
let loadPromise: Promise<SubKegiatan[]> | null = null;

// Default seed data — used only if Supabase returns empty
const defaultData: SubKegiatan[] = [
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro",
    program: "Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)",
    kegiatan: "Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro",
    paguDalamDaerah: 150000000,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 0,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  },
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0004 - Sub Kegiatan Pendataan Potensi Usaha Mikro",
    program: "Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)",
    kegiatan: "Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0004 - Sub Kegiatan Pendataan Potensi Usaha Mikro",
    paguDalamDaerah: 100000000,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 0,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  },
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0005 - Sub Kegiatan Fasilitasi Akses Permodalan",
    program: "Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)",
    kegiatan: "Pengembangan Usaha Mikro melalui Fasilitasi, Bimbingan Teknis, dan Pendampingan",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0005 - Sub Kegiatan Fasilitasi Akses Permodalan",
    paguDalamDaerah: 200000000,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 0,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  },
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0006 - Sub Kegiatan Pelatihan dan Bimbingan Teknis",
    program: "Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)",
    kegiatan: "Pengembangan Usaha Mikro melalui Fasilitasi, Bimbingan Teknis, dan Pendampingan",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0006 - Sub Kegiatan Pelatihan dan Bimbingan Teknis",
    paguDalamDaerah: 0,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 500000000,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  },
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0007 - Pelatihan Manajemen Koperasi",
    program: "Program Pengembangan Koperasi",
    kegiatan: "Peningkatan Kualitas SDM Koperasi",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0007 - Pelatihan Manajemen Koperasi",
    paguDalamDaerah: 0,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 400000000,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  },
  {
    id: "2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi",
    program: "Program Pengembangan Koperasi",
    kegiatan: "Pengawasan dan Pemeriksaan Koperasi",
    nama: "2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi",
    paguDalamDaerah: 150000000,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 0,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: "",
  }
];

/**
 * Async load from Supabase with cache
 */
export async function loadSubKegiatanData(): Promise<SubKegiatan[]> {
  if (cachedData) return cachedData;

  if (!loadPromise) {
    loadPromise = (async () => {
      const data = await fetchSubKegiatan();
      if (data.length > 0) {
        cachedData = data;
      } else {
        // Seed default data to Supabase
        await persistSubKegiatan(defaultData);
        cachedData = defaultData;
      }
      return cachedData;
    })();
  }

  return loadPromise;
}

/**
 * Synchronous access to cached data. 
 * Returns defaultData if cache not yet loaded.
 * Components should prefer loadSubKegiatanData() where possible.
 */
export function getSubKegiatanData(): SubKegiatan[] {
  if (cachedData) return cachedData;
  // Trigger async load in background
  loadSubKegiatanData();
  return defaultData;
}

export async function syncSubKegiatanData(): Promise<void> {
  cachedData = null;
  loadPromise = null;
  await loadSubKegiatanData();
}

export function saveSubKegiatanData(data: SubKegiatan[]) {
  cachedData = data;
  // Fire and forget push to Supabase
  persistSubKegiatan(data).catch(e => console.error("Gagal push sub kegiatan:", e));
}

export function getSubKegiatanByPengelola(nip: string): SubKegiatan[] {
  return getSubKegiatanData().filter(sk => sk.pengelolaNips.includes(nip));
}

export function getSubKegiatanByPPTK(nip: string): SubKegiatan[] {
  return getSubKegiatanData().filter(sk => sk.pptkNip === nip);
}

// Helper to rebuild PROGRAM_DATA format used in Pengajuan
export function buildProgramData(subKegiatanList: SubKegiatan[]): Record<string, Record<string, string[]>> {
  const result: Record<string, Record<string, string[]>> = {};
  
  subKegiatanList.forEach(sk => {
    if (!result[sk.program]) {
      result[sk.program] = {};
    }
    if (!result[sk.program][sk.kegiatan]) {
      result[sk.program][sk.kegiatan] = [];
    }
    if (!result[sk.program][sk.kegiatan].includes(sk.nama)) {
      result[sk.program][sk.kegiatan].push(sk.nama);
    }
  });

  return result;
}

// CRUD Operations
export function addSubKegiatan(newSk: SubKegiatan) {
  const data = getSubKegiatanData();
  data.push(newSk);
  cachedData = data;
  saveOneSubKegiatan(newSk).catch(e => console.error("Gagal add sub kegiatan:", e));
}

export async function updateSubKegiatan(id: string, updatedData: Partial<SubKegiatan>): Promise<void> {
  const currentData = getSubKegiatanData();
  // Deep clone to avoid mutation issues  
  const data = currentData.map(sk => ({ ...sk }));
  const index = data.findIndex(sk => sk.id === id);
  if (index !== -1) {
    console.log('[updateSubKegiatan] Before:', {
      id: data[index].id,
      paguDalam: data[index].paguDalamDaerah,
      paguLuar: data[index].paguLuarDaerah,
      pptkNip: data[index].pptkNip,
    });
    console.log('[updateSubKegiatan] Updates:', updatedData);
    
    data[index] = { ...data[index], ...updatedData };
    cachedData = data;
    
    console.log('[updateSubKegiatan] After:', {
      id: data[index].id,
      paguDalam: data[index].paguDalamDaerah,
      paguLuar: data[index].paguLuarDaerah,
      pptkNip: data[index].pptkNip,
    });
    
    await saveOneSubKegiatan(data[index]);
  } else {
    console.error('[updateSubKegiatan] Item not found with id:', id);
  }
}

export function deleteSubKegiatan(id: string) {
  const data = getSubKegiatanData();
  cachedData = data.filter(sk => sk.id !== id);
  deleteSubKegiatanById(id).catch(e => console.error("Gagal delete sub kegiatan:", e));
}

// Assignment and Budget Operations
export function updateRealisasi(id: string, amount: number, tipePerjalanan: "Dalam Daerah" | "Luar Daerah") {
  const data = getSubKegiatanData();
  const index = data.findIndex(sk => sk.id === id);
  if (index !== -1) {
    if (tipePerjalanan === "Dalam Daerah") {
      data[index].realisasiDalamDaerah += amount;
    } else {
      data[index].realisasiLuarDaerah += amount;
    }
    cachedData = data;
    saveOneSubKegiatan(data[index]).catch(e => console.error("Gagal update realisasi:", e));
  }
}

export function updatePagu(id: string, paguDalamDaerah?: number, paguLuarDaerah?: number) {
  const data = getSubKegiatanData();
  const index = data.findIndex(sk => sk.id === id);
  if (index !== -1) {
    if (paguDalamDaerah !== undefined) {
      data[index].paguDalamDaerah = paguDalamDaerah;
    }
    if (paguLuarDaerah !== undefined) {
      data[index].paguLuarDaerah = paguLuarDaerah;
    }
    cachedData = data;
    saveOneSubKegiatan(data[index]).catch(e => console.error("Gagal update pagu:", e));
  }
}

export function assignPPTK(id: string, pptkNip: string) {
  updateSubKegiatan(id, { pptkNip });
}

export function assignPengelola(id: string, pengelolaNips: string[]) {
  updateSubKegiatan(id, { pengelolaNips });
}
