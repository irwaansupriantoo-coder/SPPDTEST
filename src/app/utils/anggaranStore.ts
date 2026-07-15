export interface SubKegiatan {
  id: string; // e.g. "2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro"
  program: string;
  kegiatan: string;
  nama: string;
  paguDalamDaerah: number;
  realisasiDalamDaerah: number;
  paguLuarDaerah: number;
  realisasiLuarDaerah: number;
  pengelolaNips: string[];
  pptkNip: string;
}

const STORAGE_KEY = "sppd_sub_kegiatan_data";
const DATA_VERSION_KEY = "sppd_sub_kegiatan_version";
const CURRENT_VERSION = "v6"; // bumped to force re-seed

// Default seed data — pptkNip is empty; Bendahara must assign PPTK first
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

export function getSubKegiatanData(): SubKegiatan[] {
  if (typeof window === "undefined") return defaultData;
  
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
  const stored = localStorage.getItem(STORAGE_KEY);
  
  // Force re-seed if version mismatch or no data
  if (storedVersion !== CURRENT_VERSION || !stored) {
    saveSubKegiatanData(defaultData);
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return defaultData;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse stored sub kegiatan", e);
    saveSubKegiatanData(defaultData);
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    return defaultData;
  }
}

import { apiRequest } from './supabaseClient';

export async function syncSubKegiatanData() {
  if (typeof window === "undefined") return;
  try {
    const res = await apiRequest<SubKegiatan[]>('/sub_kegiatan');
    if (res && Array.isArray(res) && res.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
    }
  } catch (e) {
    console.error("Failed to sync sub kegiatan", e);
  }
}

export function saveSubKegiatanData(data: SubKegiatan[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  // Fire and forget push to server
  apiRequest('/sub_kegiatan', { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }).catch(e => console.error("Gagal push sub kegiatan:", e));
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
  saveSubKegiatanData(data);
}

export function updateSubKegiatan(id: string, updatedData: Partial<SubKegiatan>) {
  const data = getSubKegiatanData();
  const index = data.findIndex(sk => sk.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updatedData };
    saveSubKegiatanData(data);
  }
}

export function deleteSubKegiatan(id: string) {
  const data = getSubKegiatanData();
  const filtered = data.filter(sk => sk.id !== id);
  saveSubKegiatanData(filtered);
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
    saveSubKegiatanData(data);
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
    saveSubKegiatanData(data);
  }
}

export function assignPPTK(id: string, pptkNip: string) {
  updateSubKegiatan(id, { pptkNip });
}

export function assignPengelola(id: string, pengelolaNips: string[]) {
  updateSubKegiatan(id, { pengelolaNips });
}
