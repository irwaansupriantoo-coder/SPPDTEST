import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import * as mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ─── FILE READERS ────────────────────────────────────────────
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── TEXT EXTRACTION (per format) ────────────────────────────
export async function extractTextFromPDF(file: File, onProgress?: (msg: string) => void): Promise<string> {
  if (onProgress) onProgress('Mengekstrak teks dari PDF…');
  const ab = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  
  // Jika teks kosong (kemungkinan PDF hasil scan/gambar), gunakan OCR Tesseract pada halaman pertama
  if (fullText.trim().length < 20) {
    if (onProgress) onProgress('PDF hasil scan terdeteksi. Menjalankan OCR (mungkin butuh waktu 10-30 detik)…');
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    
    // Create an off-screen canvas (we have to use standard canvas for pdfjs, this might not work perfectly in some node environs but works in browser)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error("Failed to create blob from canvas");
    
    const imageFile = new File([blob], "page1.jpg", { type: "image/jpeg" });
    const ocrText = await extractTextFromImage(imageFile, onProgress);
    return ocrText;
  }
  
  return fullText;
}

export async function extractTextFromDOCX(file: File, onProgress?: (msg: string) => void): Promise<string> {
  if (onProgress) onProgress('Mengekstrak teks dari DOCX…');
  const ab = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return result.value;
}

export async function extractTextFromImage(file: File, onProgress?: (msg: string) => void): Promise<string> {
  if (onProgress) onProgress('Menjalankan OCR pada gambar… (mungkin perlu 10–30 detik)');
  const imageUrl = URL.createObjectURL(file);
  try {
    const { data } = await Tesseract.recognize(imageUrl, 'ind+eng', {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round((m.progress || 0) * 100);
          onProgress(`OCR sedang memproses gambar… ${pct}%`);
        }
      }
    });
    return data.text;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// ─── DATE PARSER ─────────────────────────────────────────────
function parseIndonesianDate(raw: string | null): string | null {
  if (!raw) return null;

  // Sudah format ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);

  // Bulan Indonesia → angka
  const bulanMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04',
    mei: '05', juni: '06', juli: '07', agustus: '08',
    september: '09', oktober: '10', november: '11', desember: '12',
    jan: '01', feb: '02', mar: '03', apr: '04',
    jun: '06', jul: '07', ags: '08', agt: '08', aug: '08',
    sep: '09', okt: '10', nop: '11', nov: '11', des: '12', dec: '12'
  };

  // Format: "dd Month yyyy" atau "dd-Month-yyyy"
  const m = raw.match(/(\d{1,2})\s*[\-\/\s]\s*([a-zA-Z]+)\s*[\-\/\s]\s*(\d{2,4})/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const monthName = m[2].toLowerCase();
    const month = bulanMap[monthName];
    let year = m[3];
    if (year.length === 2) year = '20' + year;
    if (month) return `${year}-${month}-${day}`;
  }

  // Format: "dd/mm/yyyy"
  const m2 = raw.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{2,4})/);
  if (m2) {
    const day = m2[1].padStart(2, '0');
    const month = m2[2].padStart(2, '0');
    let year = m2[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  return null;
}

export interface SptPelaku {
  nama: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  unit_kerja: string;
}

export interface SptData {
  no_spt: string | null;
  tanggal_spt: string | null;
  pelaku: SptPelaku[] | null;
  keperluan: string | null;
  tempat_berangkat: string | null;
  tempat_tujuan: string | null;
  tanggal_berangkat: string | null;
  tanggal_kembali: string | null;
  lama_hari: number | null;
}

// ─── EXTRACT PELAKU ──────────────────────────────────────────
function extractPelaku(flat: string, fieldMap: Record<string, string[]>): SptPelaku[] {
  const pelakuList: SptPelaku[] = [];

  // ── Strategi 1: dari marker "Nama :" / "NIP :" / "Jabatan :" ──
  const namaList = (fieldMap['nama'] || []).map(v =>
    v.replace(/\s*(?:NIP|Jabatan|Pangkat|Golongan|Tempat|Untuk).*/i, '')
     .replace(/(?:\s+|^)\d+\.\s*$/, '')
     .trim()
  ).filter(v => v.length > 2);

  const nipList = (fieldMap['nip_label'] || []).map(v => {
    const m = v.match(/([\d\s\.]+)/);
    return m ? m[1].replace(/[\s\.]/g, '').trim() : '';
  }).filter(Boolean);

  const jabatanList = (fieldMap['jabatan'] || []).map(v =>
    v.replace(/\s*(?:NIP|Pangkat|Golongan|Tempat|Nama|Untuk|Maksud).*/i, '')
     .replace(/(?:\s+|^)\d+\s*\.?\s*$/, '')
     .replace(/\bUMK\s+M\b/gi, 'UMKM')
     .trim()
  ).filter(Boolean);

  const pangkatList = (fieldMap['pangkat_label'] || []).map(v =>
    v.replace(/\s*(?:NIP|Jabatan|Tempat|Nama|Untuk).*/i, '')
     .replace(/(?:\s+|^)\d+\.\s*$/, '')
     .trim()
  ).filter(Boolean);

  if (namaList.length > 0) {
    for (let i = 0; i < namaList.length; i++) {
      pelakuList.push({
        nama: namaList[i] || '',
        nip: nipList[i] || '',
        jabatan: jabatanList[i] || '',
        pangkat: pangkatList[i] || '',
        unit_kerja: ''
      });
    }
    return pelakuList;
  }

  // ── Strategi 2: Cari NIP 18 digit dalam teks dan ambil nama di sekitarnya ──
  const nipRegex = /NIP\.?\s*[:：]?\s*([\d\s\.]{15,})/gi;
  const allNips: { nip: string; index: number }[] = [];
  let nm;
  while ((nm = nipRegex.exec(flat)) !== null) {
    const nip = nm[1].replace(/[\s\.]/g, '');
    if (nip.length >= 15) {
      allNips.push({ nip, index: nm.index });
    }
  }

  // ── Strategi 3: Cari nama dengan gelar akademik ──
  const namaGelarRegex = /(?:^|[\s,;])([A-Z][a-zA-Z.']+(?:\s+[A-Za-z.']+)*,?\s*(?:S\.?[A-Za-z]{1,4}\.?|M\.?[A-Za-z]{1,4}\.?|Dr\.?|Ir\.?|Drs\.?|Dra\.?|Hj\.?|H\.?)(?:[,\s]*(?:S\.?[A-Za-z]{1,4}\.?|M\.?[A-Za-z]{1,4}\.?|Dr\.?|Ir\.?|Ph\.?D\.?))*)/g;
  const namaGelarList: { nama: string; index: number }[] = [];
  let gm;
  while ((gm = namaGelarRegex.exec(flat)) !== null) {
    const nama = gm[1].trim();
    if (nama.length > 4 && !/(?:Surat|Dinas|Kabupaten|Koperasi|Perintah|Tugas|TCPDF|Elektronik|Sertifikat)/i.test(nama)) {
      namaGelarList.push({ nama, index: gm.index });
    }
  }

  if (allNips.length > 0) {
    for (const nipItem of allNips) {
      let bestNama = '';
      let bestDist = Infinity;
      for (const ng of namaGelarList) {
        const dist = Math.abs(ng.index - nipItem.index);
        if (dist < bestDist && dist < 300) {
          bestDist = dist;
          bestNama = ng.nama;
        }
      }
      const contextBefore = flat.substring(Math.max(0, nipItem.index - 100), nipItem.index).toLowerCase();
      const isSigner = /(?:kepala|demikian|mengetahui|dikeluarkan|ditetapkan|ttd|\$\{ttd\})/.test(contextBefore);

      if (!isSigner && bestNama) {
        pelakuList.push({
          nama: bestNama,
          nip: nipItem.nip,
          jabatan: '',
          pangkat: '',
          unit_kerja: ''
        });
      }
    }
  }

  // ── Strategi 4: Jika masih kosong, cari pola tabel bernomor ──
  if (pelakuList.length === 0) {
    const tabelRegex = /(?:^|\s)(\d+)\s*[.)]\s*([A-Z][a-zA-Z.,'\s]+?)(?:\s*[\/\-]\s*NIP\.?\s*[:：]?\s*([\d\s\.]+))?(?=\s*\d+\s*[.)]|\s*(?:Untuk|Keperluan|Tempat|$))/gi;
    let tm;
    while ((tm = tabelRegex.exec(flat)) !== null) {
      const nama = tm[2].trim();
      const nip = tm[3] ? tm[3].replace(/[\s\.]/g, '') : '';
      if (nama.length > 3) {
        pelakuList.push({ nama, nip, jabatan: '', pangkat: '', unit_kerja: '' });
      }
    }
  }

  return pelakuList;
}

// ─── REGEX PARSER ────────────────────────────────────────────────
export function parseSptDataLocal(text: string): SptData {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const flat = raw.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  const markers = [
    { key: 'nomor',             regex: /(?:Nomor|No\.?\s*(?:Surat)?)(?:\s*[:：;\|])?\s*/gi },
    { key: 'untuk',             regex: /(?:Untuk|UNTUK|Keperluan|KEPERLUAN|Maksud|MAKSUD)(?:\s*\/\s*(?:Tujuan|TUJUAN))?(?:\s*[:：;\|])?\s*/g },
    { key: 'tempat_berangkat',  regex: /(?:Tempat\s*Berangkat|Berangkat\s*dari|Tempat\s*Asal)(?:\s*[:：;\|])?\s*/gi },
    { key: 'tempat_tujuan',     regex: /(?:Tempat\s*Tujuan|Tujuan|Pergi\s*ke)(?:\s*[:：;\|])?\s*/gi },
    { key: 'lama',              regex: /(?:Lama\s*(?:nya)?|Lamanya)(?:\s*[:：;\|])?\s*/gi },
    { key: 'tgl_berangkat',     regex: /(?:Tanggal\s*Berangkat|Berangkat\s*Tanggal|Tanggal\s*Pergi|Pergi\s*Tanggal)(?:\s*[:：;\|])?\s*/gi },
    { key: 'tgl_pulang',        regex: /(?:Tanggal\s*(?:Pulang|Kembali)|Kembali\s*Tanggal|Tanggal\s*Tiba)(?:\s*[:：;\|])?\s*/gi },
    { key: 'beban_anggaran',    regex: /(?:Beban\s*Anggaran)(?:\s*[:：;\|])?\s*/gi },
    { key: 'dikeluarkan',       regex: /(?:Dikeluarkan\s*di|Ditetapkan\s*di)(?:\s*[:：;\|])?\s*/gi },
    { key: 'pada_tanggal',      regex: /(?:Pada\s*Tanggal)(?:\s*[:：;\|])?\s*/gi },
    { key: 'demikian',          regex: /Demikian\s+(?:Surat|surat)/gi },
    { key: 'nama',              regex: /(?:^|\s)(?:Nama\s*(?:Lengkap)?|Yang\s*Diperintahkan)(?:\s*[:：;\|])?\s*/gi },
    { key: 'nip_label',         regex: /(?:^|\s)NIP\.?(?:\s*[:：;\|])?\s*/gi },
    { key: 'jabatan',           regex: /(?:^|\s)Jabatan(?:\s*[:：;\|])?\s*/gi },
    { key: 'pangkat_label',     regex: /(?:^|\s)(?:Pangkat|Pangkat\s*\/\s*Gol(?:ongan)?\.?)(?:\s*[:：;\|])?\s*/gi },
  ];

  const found: { key: string; matchStart: number; valueStart: number }[] = [];
  for (const mk of markers) {
    const regex = new RegExp(mk.regex.source, 'g' + (mk.regex.ignoreCase ? 'i' : ''));
    let m;
    while ((m = regex.exec(flat)) !== null) {
      found.push({
        key: mk.key,
        matchStart: m.index,
        valueStart: m.index + m[0].length
      });
    }
  }

  found.sort((a, b) => a.matchStart - b.matchStart);

  const fieldMap: Record<string, string[]> = {};
  for (let i = 0; i < found.length; i++) {
    const entry = found[i];
    const valueStart = entry.valueStart;
    const valueEnd = (i + 1 < found.length) ? found[i + 1].matchStart : flat.length;
    const value = flat.substring(valueStart, valueEnd).trim();

    if (!fieldMap[entry.key]) fieldMap[entry.key] = [];
    fieldMap[entry.key].push(value);
  }

  function getField(key: string): string | null {
    return (fieldMap[key] && fieldMap[key][0]) ? fieldMap[key][0] : null;
  }

  let no_spt = getField('nomor');
  if (no_spt) {
    no_spt = no_spt.replace(/\s*(Untuk|Keperluan|Nama|Tempat|MEMERINTAHKAN|Memerintahkan|Kepada|Dengan|Dasar|Menimbang|Mengingat|Yang|Bahwa).*/i, '').trim();
  }

  let keperluan = getField('untuk');
  if (keperluan) {
    keperluan = keperluan.replace(/\s*(?:Tempat|Lama|Tanggal|Beban|Demikian).*/i, '').trim();
  }

  let tempat_berangkat = getField('tempat_berangkat') || 'Tanjung Redeb';
  tempat_berangkat = tempat_berangkat.replace(/\s*(?:Tempat|Lama|Tanggal|Beban|Demikian).*/i, '').trim();

  let tempat_tujuan = getField('tempat_tujuan');
  if (tempat_tujuan) {
    tempat_tujuan = tempat_tujuan.replace(/\s*(?:Lama|Tanggal|Beban|Demikian|Tempat).*/i, '').trim();
  }

  let lama_hari: number | null = null;
  const lamaRaw = getField('lama');
  if (lamaRaw) {
    const lamaMatch = lamaRaw.match(/(\d+)/);
    if (lamaMatch) lama_hari = parseInt(lamaMatch[1]);
  }

  const tglBerangkatRaw = getField('tgl_berangkat');
  let tanggal_berangkat = parseIndonesianDate(tglBerangkatRaw);

  const tglPulangRaw = getField('tgl_pulang');
  let tanggal_kembali = parseIndonesianDate(tglPulangRaw);

  const tglSptRaw = getField('pada_tanggal');
  let tanggal_spt = parseIndonesianDate(tglSptRaw);

  if (!lama_hari && tanggal_berangkat && tanggal_kembali) {
    const d1 = new Date(tanggal_berangkat);
    const d2 = new Date(tanggal_kembali);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      lama_hari = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    }
  }

  if (!tanggal_kembali && tanggal_berangkat && lama_hari) {
    const d = new Date(tanggal_berangkat);
    d.setDate(d.getDate() + lama_hari - 1);
    tanggal_kembali = d.toISOString().split('T')[0];
  }

  const pelaku = extractPelaku(flat, fieldMap);

  return {
    no_spt,
    tanggal_spt,
    pelaku: pelaku.length > 0 ? pelaku : null,
    keperluan,
    tempat_berangkat,
    tempat_tujuan,
    tanggal_berangkat,
    tanggal_kembali,
    lama_hari
  };
}

export async function processFileForOCR(file: File, onProgress?: (msg: string) => void): Promise<SptData> {
  let extractedText = '';
  const ftype = file.type;

  if (ftype === 'application/pdf') {
    extractedText = await extractTextFromPDF(file, onProgress);
  } else if (ftype.startsWith('image/')) {
    extractedText = await extractTextFromImage(file, onProgress);
  } else if (ftype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    extractedText = await extractTextFromDOCX(file, onProgress);
  } else {
    throw new Error('Format file tidak didukung. Gunakan PDF, DOCX, JPG, atau PNG.');
  }

  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error('Tidak dapat mengekstrak teks dari dokumen. Pastikan file berisi teks yang dapat dibaca.');
  }

  if (onProgress) onProgress('Menganalisis dan mengekstrak data SPT…');
  return parseSptDataLocal(extractedText);
}
