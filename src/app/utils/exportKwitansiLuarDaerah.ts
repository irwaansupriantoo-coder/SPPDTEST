import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { terbilang } from './terbilang';

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateIndo(dateStr?: string | Date) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
}

export async function exportKwitansiLuarDaerah(
  pelaksana: any,
  sppdData: any,
  rincianData: any
) {
  const response = await fetch(`/Kwitansi Luar Daerah.xlsx?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error('Gagal mengunduh template Kwitansi Luar Daerah.xlsx. Pastikan file ada di folder public.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };
  const bendahara = { nama: 'Wenry Adeputra', nip: '199106272023211019', pangkatGolongan: 'IX' };
  const pptk = { nama: 'Rahmawati', nip: '199511302022032030', pangkatGolongan: 'Penata Muda / III.a' };

  const totalUangHarian = rincianData.totalUangHarian || 0;
  const totalBiayaHotel = rincianData.totalBiayaHotel || 0;
  const totalSewaKendaraan = rincianData.sewaKendaraan?.enabled ? (rincianData.sewaKendaraan?.subtotal || 0) : 0;
  const totalPesawat = rincianData.pesawat?.enabled ? (rincianData.pesawat?.subtotal || 0) : 0;
  const totalKeretaApi = rincianData.keretaApi?.enabled ? (rincianData.keretaApi?.subtotal || 0) : 0;
  const totalBiayaTol = rincianData.biayaTol?.enabled ? parseInt(rincianData.biayaTol?.total?.toString().replace(/[^0-9]/g, '')) || 0 : 0;
  const totalTaxiBandara = rincianData.taxiBandara?.enabled ? (rincianData.taxiBandara?.subtotal || 0) : 0;
  const totalRepresentatif = rincianData.biayaRepresentatif?.enabled ? (rincianData.biayaRepresentatif?.subtotal || 0) : 0;
  
  const totalAnggaran = totalUangHarian + totalBiayaHotel + totalSewaKendaraan + totalPesawat + totalKeretaApi + totalBiayaTol + totalTaxiBandara + totalRepresentatif;

  let parsedProgram: any = {};
  let parsedDates: any = {};
  try {
    const storedProgram = localStorage.getItem(`program_${sppdData.noSppd}`);
    if (storedProgram) parsedProgram = JSON.parse(storedProgram);
    const storedDates = localStorage.getItem(`dates_${sppdData.noSppd}`);
    if (storedDates) parsedDates = JSON.parse(storedDates);
  } catch (e) {}

  const subKegiatanStr = parsedProgram.subKegiatan || sppdData.subKegiatan || 'Sub Kegiatan';
  let inisialSubKegiatan = 'PMKUM';
  if (subKegiatanStr) {
    const words = subKegiatanStr.replace(/^Sub Kegiatan\s+/i, '').split(/\s+/);
    const initials = words.filter((w: string) => /^[A-Z]/.test(w) && !['dan', 'di', 'ke', 'dari', 'yang'].includes(w.toLowerCase()))
                    .map((w: string) => w.charAt(0).toUpperCase())
                    .join('');
    if (initials) inisialSubKegiatan = initials;
  }

  const tahun = new Date().getFullYear();
  const kwitansiKey = `kwitansi_luar_${sppdData.noSppd}_${pelaksana.nip}`;
  let noKwitansi = localStorage.getItem(kwitansiKey);
  if (!noKwitansi) {
    const counterKey = `kwitansi_counter_${inisialSubKegiatan}_${tahun}`;
    let currentCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    currentCounter += 1;
    localStorage.setItem(counterKey, currentCounter.toString());
    const incStr = String(currentCounter).padStart(2, '0');
    noKwitansi = `${incStr}/${inisialSubKegiatan}/K/${tahun}`;
    localStorage.setItem(kwitansiKey, noKwitansi);
  }

  let kodeRekening = '2.17.07.2.01.04.5.1.02.04.01.0003';
  if (subKegiatanStr.includes(' - ')) {
    kodeRekening = subKegiatanStr.split(' - ')[0];
  }

  const tglMulai = parsedDates.tanggalPergi || sppdData.tanggalPergi || '';
  const tglSelesai = parsedDates.tanggalKembali || sppdData.tanggalKembali || '';
  const tglStr = (tglMulai && tglSelesai) ? `${formatDateIndo(tglMulai)} s/d ${formatDateIndo(tglSelesai)}` : '';

  let mockKeperluan = '';
  try {
    const mockData = localStorage.getItem('mock_pengajuan');
    if (mockData) {
      const parsedMock = JSON.parse(mockData);
      const matched = parsedMock.find((m: any) => m.noSppd === sppdData.noSppd);
      if (matched && matched.keperluan) {
        mockKeperluan = matched.keperluan;
      }
    }
  } catch (e) {}

  const keperluan = sppdData.keperluan || mockKeperluan || parsedProgram.keperluan || parsedProgram.maksud || sppdData.maksud || '';
  const namaSubKegiatan = subKegiatanStr.includes(' - ') ? subKegiatanStr.split(' - ')[1] : subKegiatanStr;
  const kalimatMaksud = `Belanja Perjalanan Dinas Luar Kota. Belanja Perjalanan Dinas Luar Daerah. Perjalanan Dinas Luar Daerah ${keperluan} pada Tanggal ${tglStr}. ${namaSubKegiatan}.\nPenerima An. ${pelaksana.nama}`;
  const terbilangStr = terbilang(totalAnggaran).toUpperCase() + ' RUPIAH';
  const tempatTanggal = `Tanjung Redeb, ${formatDateIndo(new Date())}`;

  const dataMapping: Record<string, string | number> = {
    'H2': kodeRekening,
    'H3': noKwitansi,
    'H4': parsedProgram.program || sppdData.program || '',
    'H5': parsedProgram.kegiatan || sppdData.kegiatan || '',
    'H6': namaSubKegiatan,
    'E9': terbilangStr,
    'E19': totalAnggaran,
    'E10': kalimatMaksud,
    'E14': `An. ${pelaksana.nama}`,
    'I15': tempatTanggal,
    'I17': '$$$$',
    'I19': pelaksana.nama,
    'I20': pelaksana.nip ? `NIP. ${pelaksana.nip}` : '-',
    'I27': '$',
    'I29': bendahara.nama,
    'I30': bendahara.pangkatGolongan,
    'I31': `NIP. ${bendahara.nip}`,
    'F27': '$$',
    'F29': pptk.nama,
    'F30': pptk.pangkatGolongan,
    'F31': `NIP. ${pptk.nip}`,
    'C27': '$$$',
    'C29': kpa.nama,
    'C30': kpa.pangkatGolongan,
    'C31': `NIP. ${kpa.nip}`,
  };

  const worksheetFiles = Object.keys(zip.files).filter(k => k.startsWith('xl/worksheets/sheet') && k.endsWith('.xml'));
  
  for (const wsFile of worksheetFiles) {
    let sheetXml = await zip.file(wsFile)?.async('string');
    if (sheetXml) {
      for (const [cellRef, value] of Object.entries(dataMapping)) {
        const cellRegex = new RegExp(`(<c r="${cellRef}"[^>]*?)(/>|>[\\s\\S]*?</c>)`);
        const match: RegExpMatchArray | null = sheetXml.match(cellRegex);
        if (match) {
          let openTag: string = match[1];
          
          if (typeof value === 'number') {
            openTag = openTag.replace(/\s*t="[^"]*"/, '');
            sheetXml = sheetXml.replace(cellRegex, `${openTag}><v>${value}</v></c>`);
          } else {
            if (/ t="[^"]*"/.test(openTag)) {
              openTag = openTag.replace(/ t="[^"]*"/, ' t="inlineStr"');
            } else {
              openTag = openTag + ' t="inlineStr"';
            }
            const safeVal = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            sheetXml = sheetXml.replace(cellRegex, `${openTag}><is><t xml:space="preserve">${safeVal}</t></is></c>`);
          }
        }
      }
      
      sheetXml = sheetXml.replace(/<f>[^<]*<\/f>/g, '');
      zip.file(wsFile, sheetXml);
    }
  }

  // Remove calcChain to avoid corruption prompt
  zip.remove('xl/calcChain.xml');
  let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
  if (contentTypes) {
    contentTypes = contentTypes.replace(/<Override PartName="\/xl\/calcChain.xml"[^/]*\/>/, '');
    zip.file('[Content_Types].xml', contentTypes);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Kwitansi_Luar_Daerah_${pelaksana.nama.replace(/\s+/g, '_')}.xlsx`);
}
