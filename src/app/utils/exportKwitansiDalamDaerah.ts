import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { terbilang } from './terbilang.ts';
import { getKwitansiNumber, setKwitansiNumber } from './supabaseDataStore';

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function splitTextIntoLines(text: string, maxLength: number): string[] {
  const lines: string[] = [];
  let current = text;
  while (current.length > maxLength) {
    let splitIndex = current.lastIndexOf(' ', maxLength);
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }
    lines.push(current.substring(0, splitIndex) + ' ');
    current = current.substring(splitIndex).trim();
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

export async function exportKwitansiDalamDaerah(dataHeader: any, travelersList: any[]) {
  console.log('[exportKwitansi] dataHeader:', {
    program: dataHeader.program,
    kegiatan: dataHeader.kegiatan,
    subKegiatan: dataHeader.subKegiatan,
    noSppdList: dataHeader.noSppdList,
    tanggalDokumen: dataHeader.tanggalDokumen,
  });

  // Fetch the pristine original template that hasn't been mangled by exceljs
  const response = await fetch('/Kwitansi_Dalam_Daerah.xlsx');
  const arrayBuffer = await response.arrayBuffer();

  const zip = await JSZip.loadAsync(arrayBuffer);

  const totalKeseluruhan = travelersList.reduce((sum, t) => {
    return sum + (t.totalUangHarian || 0) + (t.totalBiayaHotel || 0) + (t.totalSewaKendaraan || 0);
  }, 0);

  if (travelersList.length > 0) {
    const mainTraveler = travelersList[0];
    const terbilangStr = terbilang(totalKeseluruhan).toUpperCase() + ' RUPIAH';
    const suffix = travelersList.length > 1 ? ' Dkk.' : '';
    const anNamaStr = `an. ${mainTraveler.nama}${suffix}`;
    const tanggalDokumen = dataHeader.tanggalDokumen instanceof Date
      ? dataHeader.tanggalDokumen
      : new Date(dataHeader.tanggalDokumen || Date.now());
    const dateStr = `Tanjung Redeb, ${formatDate(tanggalDokumen)}`;

    let kegNeedsOverflow = false;
    let subNeedsOverflow = false;
    let maksudOverflowLines: string[] = [];
    
    let subKegLaporanOverflowLines: string[] = [];

    // 1. Update sharedStrings.xml for text strings
    let sharedStrings = await zip.file('xl/sharedStrings.xml')?.async('string');
    if (sharedStrings) {
      sharedStrings = sharedStrings.replace(
        'DELAPAN JUTA LIMA RATUS DELAPAN PULUH RIBU RUPIAH',
        terbilangStr
      );
      sharedStrings = sharedStrings.replace(
        'an. H.Hasnawati, S.E., M.Si. Dkk.',
        anNamaStr
      );
      sharedStrings = sharedStrings.replace(
        'Tanjung Redeb, 8 Juni 2023',
        dateStr
      );
      // I23: Replace the year in "Tgl …………..…………………2023"
      // The dots are a mix of ellipsis (U+2026) and regular periods (U+002E)
      sharedStrings = sharedStrings.replace(
        /Tgl[\s.\u2026]+2023/,
        `Tgl ...............${tanggalDokumen.getFullYear()}`
      );

      // Inject Program, Kegiatan, Sub Kegiatan, Kode Rekening
      const rawSub = dataHeader.subKegiatan || '';
      let kodeRekeningStr = '2.17.07.2.01.04.5.1.02.04.01.0003';
      let subKegiatanStr = rawSub;
      
      if (rawSub.includes(' - ')) {
        const parts = rawSub.split(' - ');
        kodeRekeningStr = parts[0];
        subKegiatanStr = parts.slice(1).join(' - ');
      }

      // Prepend "Sub Kegiatan " if not already present
      if (subKegiatanStr && !/^Sub Kegiatan\s/i.test(subKegiatanStr)) {
        subKegiatanStr = 'Sub Kegiatan ' + subKegiatanStr;
      }

      // Generate Inisial Sub Kegiatan (e.g. PKPPUM)
      // Remove "Sub Kegiatan " from the start, split words, filter lowercase like "dan", get first char
      const words = subKegiatanStr.replace(/^Sub Kegiatan\s+/i, '').split(/\s+/);
      const initials = words
        .filter((w: string) => /^[A-Z]/.test(w) && !['dan', 'di', 'ke', 'dari', 'yang'].includes(w.toLowerCase()))
        .map((w: string) => w.charAt(0).toUpperCase())
        .join('');
      
      const inisialFix = initials || 'PKPPUM';
      
      const tahun = tanggalDokumen.getFullYear();
      let noKwitansi = '';

      if (dataHeader.noSppdList && dataHeader.noSppdList.length > 0) {
        const primarySppd = dataHeader.noSppdList[0];
        const sppdKey = `kwitansi_no_${primarySppd}`;
        const existingNo = await getKwitansiNumber(sppdKey);
        
        if (existingNo) {
          noKwitansi = existingNo;
        } else {
          const counterKey = `kwitansi_counter_${inisialFix}_${tahun}`;
          // Get current counter, increment
          let currentCounter = parseInt(await getKwitansiNumber(counterKey) || '0', 10);
          currentCounter += 1;
          
          const incStr = String(currentCounter).padStart(2, '0');
          noKwitansi = `${incStr}/${inisialFix}/K/${tahun}`;
          
          await setKwitansiNumber(sppdKey, noKwitansi);
          await setKwitansiNumber(counterKey, currentCounter.toString());
        }
      } else {
        noKwitansi = `01/${inisialFix}/K/${tahun}`;
      }

      sharedStrings = sharedStrings.replace(
        '04/PKPPUM/K/2022',
        noKwitansi
      );

      if (kodeRekeningStr) {
        sharedStrings = sharedStrings.replace(
          '2.17.07.2.01.04.5.1.02.04.01.0003',
          kodeRekeningStr
        );
      }
      
      if (dataHeader.program) {
        sharedStrings = sharedStrings.replace(
          'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)',
          dataHeader.program
        );
      }

      if (dataHeader.maksud) {
        let maksudText = dataHeader.maksud;
        if (dataHeader.tanggalMulai && dataHeader.tanggalSelesai) {
          maksudText += ` pada tanggal ${formatDate(dataHeader.tanggalMulai)} sampai ${formatDate(dataHeader.tanggalSelesai)}.`;
        }

        sharedStrings = sharedStrings.replace(
          '<t>Pelaksanaan Kegiatan Pelatihan Pengolahan Ikan di Kec. Biduk-Biduk</t>',
          `<t>${maksudText}</t>`
        );
      }

      // --- Kegiatan (H5 + H6 overflow) ---
      if (dataHeader.kegiatan) {
        let kegPart1 = dataHeader.kegiatan;
        let kegPart2 = '';
        if (kegPart1.length > 65) {
          const splitIndex = kegPart1.lastIndexOf(' ', 65);
          if (splitIndex !== -1) {
            kegPart2 = kegPart1.substring(splitIndex + 1);
            kegPart1 = kegPart1.substring(0, splitIndex) + ' ';
            kegNeedsOverflow = true;
          }
        }
        
        // H5: replace kegiatan part 1
        sharedStrings = sharedStrings.replace(
          'Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, ',
          kegPart1
        );
        // H6: replace kegiatan part 2
        sharedStrings = sharedStrings.replace(
          'kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan',
          kegPart2
        );
      }

      // --- Sub Kegiatan (H7 + H8 overflow) ---
      if (subKegiatanStr) {
        let subPart1 = subKegiatanStr;
        let subPart2 = '';
        if (subPart1.length > 65) {
          const splitIndex = subPart1.lastIndexOf(' ', 65);
          if (splitIndex !== -1) {
            subPart2 = subPart1.substring(splitIndex + 1);
            subPart1 = subPart1.substring(0, splitIndex) + ' ';
            subNeedsOverflow = true;
          }
        }

        // IMPORTANT: Use XML <t>...</t> tags to target the EXACT shared string entry.
        // The template has TWO entries containing similar text:
        //   Index 35 (full): "Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro"
        //   Index 37 (H7 part1): "Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan"
        // Without tags, replace() hits index 35 first and leaves H7 (index 37) unchanged.

        // Replace the full sub kegiatan name (index 35) used as a label elsewhere
        sharedStrings = sharedStrings.replace(
          '<t>Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro</t>',
          `<t>${subKegiatanStr}</t>`
        );

        // Replace H7 part 1 (index 37) - now safe because index 35 was already changed above
        sharedStrings = sharedStrings.replace(
          '<t>Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan</t>',
          `<t>${subPart1}</t>`
        );

        // Replace H8 part 2 (index 38)
        sharedStrings = sharedStrings.replace(
          '<t>Usaha Mikro</t>',
          `<t>${subPart2}</t>`
        );
      }

      // 1b. Replace Pejabat Signatures in sharedStrings
      if (dataHeader.kpa) {
        sharedStrings = sharedStrings.replace('Hj. Hasnawati, S.E., M.Si.', dataHeader.kpa.nama);
        sharedStrings = sharedStrings.replace('Pembina', dataHeader.kpa.pangkatGolongan || 'Pembina');
        sharedStrings = sharedStrings.replace('19681231 199903 2 019', dataHeader.kpa.nip || '');
      }
      if (dataHeader.pptk) {
        sharedStrings = sharedStrings.replace('Masitah Usis', dataHeader.pptk.nama);
        sharedStrings = sharedStrings.replace('19650727 198603 2 021', dataHeader.pptk.nip || '');
        if (dataHeader.pptk.pangkatGolongan) {
          sharedStrings = sharedStrings.replace('Penata Tingkat I / IIId', dataHeader.pptk.pangkatGolongan);
          sharedStrings = sharedStrings.replace('Penata Tingkat I', dataHeader.pptk.pangkatGolongan);
        }
      }
      if (dataHeader.bendahara) {
        sharedStrings = sharedStrings.replace('Darwis Iskandar', dataHeader.bendahara.nama);
        sharedStrings = sharedStrings.replace('19720613 200701 1 023', dataHeader.bendahara.nip || '');
        if (dataHeader.bendahara.pangkatGolongan) {
          sharedStrings = sharedStrings.replace('Pengatur / II.c', dataHeader.bendahara.pangkatGolongan);
          sharedStrings = sharedStrings.replace('Penata / III.c', dataHeader.bendahara.pangkatGolongan);
          sharedStrings = sharedStrings.replace('Penata Muda / III.a', dataHeader.bendahara.pangkatGolongan);
          sharedStrings = sharedStrings.replace('Pengatur Muda Tingkat I', dataHeader.bendahara.pangkatGolongan);
        }
      }

      zip.file('xl/sharedStrings.xml', sharedStrings);
    }

    // 2. Update sheet1.xml for numeric value and the I19 formula
    let sheet1 = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
    if (sheet1) {
      // Set Row Height to 25 for Row 12 (Maksud Perjalanan Dinas)
      sheet1 = sheet1.replace(
        /<row r="12"([^>]*)>/,
        '<row r="12"$1 ht="25" customHeight="1">'
      );

      // Replace the numeric value in E19
      // E19 in template is <c r="E19" s="71"><v>8580000</v></c>
      sheet1 = sheet1.replace(
        '<c r="E19" s="71"><v>8580000</v></c>',
        `<c r="E19" s="71"><v>${totalKeseluruhan}</v></c>`
      );

      // Replace I19 formula with inline string containing the recipient name
      // I19 in template is <c r="I19" s="72" t="str"><f>C27</f><v>Hj. Hasnawati, S.E., M.Si.</v></c>
      sheet1 = sheet1.replace(
        '<c r="I19" s="72" t="str"><f>C27</f><v>Hj. Hasnawati, S.E., M.Si.</v></c>',
        `<c r="I19" s="72" t="inlineStr"><is><t>${mainTraveler.nama}</t></is></c>`
      );

      // Replace I20 formula with inline string containing the recipient NIP
      // I20 in template contains <f>C29</f>
      sheet1 = sheet1.replace(
        /<c r="I20" s="61" t="str"><f>C29<\/f><v[^>]*>.*?<\/v><\/c>/s,
        `<c r="I20" s="61" t="inlineStr"><is><t xml:space="preserve"> NIP. ${mainTraveler.nip || '-'}\n\n</t></is></c>`
      );

      // Hide row 6 entirely if kegiatan doesn't need overflow
      if (!kegNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="6")/,
          '$1 hidden="1"'
        );
      }

      // Hide row 8 entirely if sub kegiatan doesn't need overflow
      if (!subNeedsOverflow) {
        sheet1 = sheet1.replace(
          /(<row r="8")/,
          '$1 hidden="1"'
        );
      }
      
      // Strip any remaining formulas from sheet1.xml to avoid calcChain inconsistencies
      sheet1 = sheet1.replace(/<f>[^<]*<\/f>/g, '');
      
      zip.file('xl/worksheets/sheet1.xml', sheet1);
    }

    // 3. Update styles.xml for Wrap Text on Maksud Perjalanan Dinas
    let styles = await zip.file('xl/styles.xml')?.async('string');
    if (styles) {
      styles = styles.split(
        '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left"/></xf>'
      ).join(
        '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>'
      );
      zip.file('xl/styles.xml', styles);
    }
    
    // Remove calcChain.xml and its reference from [Content_Types].xml
    // JSZip.remove() only deletes the file but leaves the Content_Types entry,
    // causing Excel to detect a missing part and show a repair warning.
    zip.remove('xl/calcChain.xml');
    
    let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
    if (contentTypes) {
      contentTypes = contentTypes.replace(
        /<Override PartName="\/xl\/calcChain.xml"[^/]*\/>/,
        ''
      );
      zip.file('[Content_Types].xml', contentTypes);
    }
  }

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Kwitansi_Dalam_Daerah_${dataHeader.noSppdList?.[0]?.replace(/\//g, '_') || 'SPPD'}.xlsx`);
}
