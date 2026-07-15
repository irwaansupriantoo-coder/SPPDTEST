import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { terbilang } from './terbilang';

export const exportRincianDalamDaerah = async (
  dataHeader: {
    kota: string;
    lamaHari: number;
    tanggalMulai: Date;
    tanggalSelesai: Date;
    noSppdList: string[];
    tanggalDokumen: Date;
    kpa?: any;
    bendahara?: any;
  },
  travelers: Array<{
    nama: string;
    nip: string;
    pangkatGolongan?: string;
    jumlahHari: number;
    uangHarianPerHari: number;
    totalUangHarian: number;
    totalBiayaHotel: number;
    totalSewaKendaraan: number;
    keterangan?: string;
  }>
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rincian');

  // Set Default Font
  worksheet.properties.defaultRowHeight = 15;

  const accountingFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';

  // Columns setup
  worksheet.columns = [
    { key: 'A', width: 4.5 },   // NO
    { key: 'B', width: 28 },    // NAMA
    { key: 'C', width: 22 },    // Pangkat Gol
    { key: 'D', width: 4.5 },   // Hari
    { key: 'E', width: 4.5 },   // OH
    { key: 'F', width: 2.5 },   // x
    { key: 'G', width: 12 },    // Rate
    { key: 'H', width: 2.5 },   // =
    { key: 'I', width: 14 },    // Total Uang Harian
    { key: 'J', width: 15 },    // Penginapan
    { key: 'K', width: 15 },    // Transportasi
    { key: 'L', width: 15 },    // JUMLAH
    { key: 'M', width: 18 },    // KETERANGAN
  ];

  // Title Rows
  worksheet.mergeCells('A1:M1');
  worksheet.getCell('A1').value = 'RINCIAN BIAYA PERJALANAN DINAS DALAM DAERAH KABUPATEN BERAU';
  worksheet.getCell('A1').font = { bold: true, name: 'Times New Roman', size: 11, underline: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:M2');
  worksheet.getCell('A2').value = `KECAMATAN ${dataHeader.kota.toUpperCase()}`;
  worksheet.getCell('A2').font = { bold: true, name: 'Times New Roman', size: 11, underline: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  const formatDate = (date: Date) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const numberToText = (num: number) => {
    const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas'];
    return words[num] || num.toString();
  };

  worksheet.mergeCells('A4:M4');
  worksheet.getCell('A4').value = `Selama ${dataHeader.lamaHari} (${numberToText(dataHeader.lamaHari)}) hari Pada Tanggal : ${formatDate(dataHeader.tanggalMulai)} s/d ${formatDate(dataHeader.tanggalSelesai)}`;
  worksheet.getCell('A4').font = { bold: true, name: 'Times New Roman', size: 11 };
  worksheet.getCell('A4').alignment = { horizontal: 'left' };

  // SPD Numbers
  worksheet.getCell('A5').value = 'LAMPIRAN SPD NOMOR';
  worksheet.getCell('A5').font = { name: 'Times New Roman', size: 10 };
  dataHeader.noSppdList.forEach((spd, index) => {
    worksheet.mergeCells(`C${5 + index}:G${5 + index}`);
    worksheet.getCell(`C${5 + index}`).value = `: ${spd}`;
    worksheet.getCell(`C${5 + index}`).font = { name: 'Times New Roman', size: 11 };
  });

  const lastSpdRow = 4 + dataHeader.noSppdList.length;

  // Tanggal Dokumen
  worksheet.getCell(`A${lastSpdRow + 2}`).value = 'TANGGAL';
  worksheet.getCell(`A${lastSpdRow + 2}`).font = { name: 'Times New Roman', size: 10 };
  worksheet.mergeCells(`C${lastSpdRow + 2}:E${lastSpdRow + 2}`);
  worksheet.getCell(`C${lastSpdRow + 2}`).value = `: ${formatDate(dataHeader.tanggalDokumen)}`;
  worksheet.getCell(`C${lastSpdRow + 2}`).font = { name: 'Times New Roman', size: 10 };

  // Table Headers
  const headerStart = lastSpdRow + 3;
  
  // Row 1 of Header
  worksheet.mergeCells(`A${headerStart}:A${headerStart + 2}`);
  worksheet.getCell(`A${headerStart}`).value = 'NO';
  
  worksheet.mergeCells(`B${headerStart}:C${headerStart}`);
  worksheet.getCell(`B${headerStart}`).value = 'RINCIAN BIAYA PERJALANAN DINAS';

  worksheet.mergeCells(`D${headerStart}:I${headerStart + 1}`);
  worksheet.getCell(`D${headerStart}`).value = 'UANG HARIAN';

  worksheet.mergeCells(`J${headerStart}:J${headerStart + 1}`);
  worksheet.getCell(`J${headerStart}`).value = 'Biaya';
  worksheet.getCell(`J${headerStart + 2}`).value = 'Penginapan';

  worksheet.mergeCells(`K${headerStart}:K${headerStart + 1}`);
  worksheet.getCell(`K${headerStart}`).value = 'Biaya';
  worksheet.getCell(`K${headerStart + 2}`).value = 'Transportasi';

  worksheet.mergeCells(`L${headerStart}:L${headerStart + 2}`);
  worksheet.getCell(`L${headerStart}`).value = 'JUMLAH';

  worksheet.mergeCells(`M${headerStart}:M${headerStart + 2}`);
  worksheet.getCell(`M${headerStart}`).value = 'KETERANGAN';

  // Row 2 of Header
  worksheet.getCell(`B${headerStart + 1}`).value = 'NAMA';
  worksheet.getCell(`C${headerStart + 1}`).value = 'Pangkat Gol /';
  
  // Row 3 of Header
  worksheet.getCell(`B${headerStart + 2}`).value = ''; 
  worksheet.getCell(`C${headerStart + 2}`).value = 'Ruang';

  // Format headers
  for (let r = headerStart; r <= headerStart + 2; r++) {
    for (let c = 1; c <= 13; c++) {
      const cell = worksheet.getCell(r, c);
      cell.font = { bold: true, name: 'Times New Roman', size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
      // Determine vertical lines for headers:
      let leftBorder = false;
      let rightBorder = false;
      if (['A', 'B', 'D', 'J', 'K', 'L', 'M'].includes(worksheet.getColumn(c).letter)) leftBorder = true;
      if (['A', 'C', 'I', 'J', 'K', 'L', 'M'].includes(worksheet.getColumn(c).letter)) rightBorder = true;

      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: leftBorder ? { style: 'thin' } : undefined,
        right: rightBorder ? { style: 'thin' } : undefined
      };
    }
  }

  // Data Rows
  let currentRow = headerStart + 3;
  let totalKeseluruhan = 0;

  travelers.forEach((t, i) => {
    const rowNum = i + 1;
    const subtotal = t.totalUangHarian + t.totalBiayaHotel + t.totalSewaKendaraan;
    totalKeseluruhan += subtotal;

    // Line 1: Name and values
    worksheet.getCell(`A${currentRow}`).value = rowNum;
    worksheet.getCell(`B${currentRow}`).value = t.nama;
    worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10 };
    worksheet.getCell(`C${currentRow}`).value = t.pangkatGolongan || '-';
    worksheet.getCell(`D${currentRow}`).value = t.jumlahHari;
    worksheet.getCell(`E${currentRow}`).value = 'OH';
    worksheet.getCell(`F${currentRow}`).value = 'x';
    worksheet.getCell(`G${currentRow}`).value = t.uangHarianPerHari;
    worksheet.getCell(`G${currentRow}`).numFmt = accountingFmt;
    worksheet.getCell(`H${currentRow}`).value = '=';
    worksheet.getCell(`I${currentRow}`).value = t.totalUangHarian;
    worksheet.getCell(`I${currentRow}`).numFmt = accountingFmt;
    worksheet.getCell(`J${currentRow}`).value = t.totalBiayaHotel;
    worksheet.getCell(`J${currentRow}`).numFmt = accountingFmt;
    worksheet.getCell(`K${currentRow}`).value = t.totalSewaKendaraan;
    worksheet.getCell(`K${currentRow}`).numFmt = accountingFmt;
    worksheet.getCell(`L${currentRow}`).value = subtotal;
    worksheet.getCell(`L${currentRow}`).numFmt = accountingFmt;

    // Line 2: NIP
    worksheet.getCell(`B${currentRow + 1}`).value = t.nip && t.nip !== '-' ? `NIP. ${t.nip}` : 'PTT';
    worksheet.getCell(`B${currentRow + 1}`).font = { name: 'Times New Roman', size: 10 };

    // Format Data Rows Borders & Alignment
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach((col) => {
      const cell1 = worksheet.getCell(`${col}${currentRow}`);
      const cell2 = worksheet.getCell(`${col}${currentRow + 1}`);
      
      cell1.font = cell1.font || { name: 'Times New Roman', size: 10 };
      cell2.font = cell2.font || { name: 'Times New Roman', size: 10 };
      
      cell1.alignment = { vertical: 'middle', wrapText: true, horizontal: ['A','D','E','F','H'].includes(col) ? 'center' : (col === 'C' ? 'center' : 'left') };
      
      let leftBorder = false;
      let rightBorder = false;
      if (['A', 'B', 'C', 'D', 'J', 'K', 'L', 'M'].includes(col)) leftBorder = true;
      if (['A', 'B', 'C', 'I', 'J', 'K', 'L', 'M'].includes(col)) rightBorder = true;

      if (col !== 'M') {
        cell2.alignment = cell1.alignment;
        cell1.border = { 
          top: { style: 'thin' }, 
          left: leftBorder ? { style: 'thin' } : undefined, 
          right: rightBorder ? { style: 'thin' } : undefined, 
          bottom: { style: 'dotted' } 
        };
        cell2.border = { 
          bottom: { style: 'thin' }, 
          left: leftBorder ? { style: 'thin' } : undefined, 
          right: rightBorder ? { style: 'thin' } : undefined, 
          top: { style: 'dotted' } 
        };
      } else {
        cell1.border = { left: { style: 'thin' }, right: { style: 'thin' } };
        cell2.border = { left: { style: 'thin' }, right: { style: 'thin' } };
      }
    });

    currentRow += 2;
  });

  // Global Keterangan Merge
  const dataStartRow = headerStart + 3;
  if (currentRow > dataStartRow) {
    worksheet.mergeCells(`M${dataStartRow}:M${currentRow - 1}`);
    const ketCell = worksheet.getCell(`M${dataStartRow}`);
    ketCell.value = 'Uang harian dibayarkan 2 (dua) hari saat berangkat dan pulang';
    ketCell.font = { name: 'Times New Roman', size: 10 };
    ketCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    ketCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  // Total Row
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const totalCell = worksheet.getCell(`A${currentRow}`);
  totalCell.value = 'Jumlah Biaya Perjalanan Dinas';
  totalCell.font = { bold: true, name: 'Times New Roman', size: 10 };
  totalCell.alignment = { horizontal: 'left', vertical: 'middle' };
  
  worksheet.mergeCells(`K${currentRow}:L${currentRow}`);
  const sumCell = worksheet.getCell(`K${currentRow}`);
  sumCell.value = totalKeseluruhan;
  sumCell.font = { bold: true, name: 'Times New Roman', size: 10 };
  sumCell.numFmt = accountingFmt;
  sumCell.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 13; c++) {
    const cell = worksheet.getCell(currentRow, c);
    let leftBorder = ['A', 'K', 'M'].includes(worksheet.getColumn(c).letter);
    let rightBorder = ['J', 'L', 'M'].includes(worksheet.getColumn(c).letter);
    
    cell.border = { 
      top: { style: 'thin' }, 
      bottom: { style: 'thin' }, 
      left: leftBorder ? { style: 'thin' } : undefined, 
      right: rightBorder ? { style: 'thin' } : undefined 
    };
  }


  currentRow++;
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  const terbilangCell = worksheet.getCell(`A${currentRow}`);
  terbilangCell.value = `Terbilang : ( ${terbilang(totalKeseluruhan).trim()} Rupiah )`;
  terbilangCell.font = { italic: true, bold: true, name: 'Times New Roman', size: 10 };
  terbilangCell.alignment = { horizontal: 'left', vertical: 'middle' };
  terbilangCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  // Signature Section
  currentRow += 2;
  
  worksheet.getCell(`B${currentRow}`).value = 'Telah dibayar sejumlah uang sebesar,';
  worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(`B${currentRow + 1}`).value = totalKeseluruhan;
  worksheet.getCell(`B${currentRow + 1}`).font = { bold: true, name: 'Times New Roman', size: 10 };
  worksheet.getCell(`B${currentRow + 1}`).numFmt = accountingFmt;

  worksheet.mergeCells(`L${currentRow}:M${currentRow}`);
  const dateCell = worksheet.getCell(`L${currentRow}`);
  dateCell.value = `Tanjung Redeb, ${formatDate(dataHeader.tanggalDokumen)}`;
  dateCell.font = { name: 'Times New Roman', size: 10 };
  dateCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells(`A${currentRow + 3}:B${currentRow + 3}`);
  const bendahara1 = worksheet.getCell(`A${currentRow + 3}`);
  bendahara1.value = 'Bendahara Pengeluaran Pembantu,';
  bendahara1.font = { name: 'Times New Roman', size: 10 };
  bendahara1.alignment = { horizontal: 'center' };

  worksheet.mergeCells(`A${currentRow + 7}:B${currentRow + 7}`);
  const bendahara2 = worksheet.getCell(`A${currentRow + 7}`);
  bendahara2.value = dataHeader.bendahara?.nama || 'Darwis Iskandar';
  bendahara2.font = { name: 'Times New Roman', size: 10, underline: true };
  bendahara2.alignment = { horizontal: 'center' };
  
  worksheet.mergeCells(`A${currentRow + 8}:B${currentRow + 8}`);
  const bendahara3 = worksheet.getCell(`A${currentRow + 8}`);
  bendahara3.value = dataHeader.bendahara?.pangkatGolongan || '';
  bendahara3.font = { name: 'Times New Roman', size: 10 };
  bendahara3.alignment = { horizontal: 'center' };

  worksheet.mergeCells(`A${currentRow + 9}:B${currentRow + 9}`);
  const bendahara4 = worksheet.getCell(`A${currentRow + 9}`);
  bendahara4.value = dataHeader.bendahara?.nip ? `NIP. ${dataHeader.bendahara.nip}` : 'NIP. 19720613 200701 1 023';
  bendahara4.font = { name: 'Times New Roman', size: 10 };
  bendahara4.alignment = { horizontal: 'center' };

  // Signature Section Header
  worksheet.mergeCells(`D${currentRow + 2}:H${currentRow + 2}`);
  const ymCell = worksheet.getCell(`D${currentRow + 2}`);
  ymCell.value = 'Yang Menerima';
  ymCell.font = { name: 'Times New Roman', size: 10 };
  ymCell.alignment = { horizontal: 'left', vertical: 'middle' };
  
  const jmCell = worksheet.getCell(`I${currentRow + 2}`);
  jmCell.value = 'Jumlah';
  jmCell.font = { name: 'Times New Roman', size: 10 };
  jmCell.alignment = { horizontal: 'center' };
  
  worksheet.mergeCells(`L${currentRow + 2}:M${currentRow + 2}`);
  const ttCell = worksheet.getCell(`L${currentRow + 2}`);
  ttCell.value = 'Tanda Tangan';
  ttCell.font = { name: 'Times New Roman', size: 10 };
  ttCell.alignment = { horizontal: 'center' };

  let sigRow = currentRow + 4;
  travelers.forEach((t, i) => {
    // 1. Nomer di kolom C, align right
    const numCell = worksheet.getCell(`C${sigRow}`);
    numCell.value = i + 1;
    numCell.font = { name: 'Times New Roman', size: 10 };
    numCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // 2. Nama di kolom D:H, merged, align left
    worksheet.mergeCells(`D${sigRow}:H${sigRow}`);
    const nameCell = worksheet.getCell(`D${sigRow}`);
    nameCell.value = t.nama;
    nameCell.font = { name: 'Times New Roman', size: 10 };
    nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
    
    // 3. Jumlah uang di kolom I
    const valCell = worksheet.getCell(`I${sigRow}`);
    valCell.value = t.totalUangHarian + t.totalBiayaHotel + t.totalSewaKendaraan;
    valCell.font = { name: 'Times New Roman', size: 10 };
    valCell.numFmt = accountingFmt;
    
    // Tanda Tangan di J / K
    if (i % 2 === 0) {
      worksheet.getCell(`L${sigRow}`).value = `${i + 1}. .......................`;
      worksheet.getCell(`L${sigRow}`).font = { name: 'Times New Roman', size: 10 };
    } else {
      worksheet.getCell(`M${sigRow}`).value = `${i + 1}. .......................`;
      worksheet.getCell(`M${sigRow}`).font = { name: 'Times New Roman', size: 10 };
    }
    
    sigRow += 2;
  });

  worksheet.mergeCells(`D${sigRow}:H${sigRow}`);
  const jdCell = worksheet.getCell(`D${sigRow}`);
  jdCell.value = 'Jumlah dibayar';
  jdCell.font = { name: 'Times New Roman', size: 10 };
  jdCell.alignment = { horizontal: 'left' };
  
  const jvCell = worksheet.getCell(`I${sigRow}`);
  jvCell.value = totalKeseluruhan;
  jvCell.font = { bold: true, name: 'Times New Roman', size: 10 };
  jvCell.numFmt = accountingFmt;
  
  // Apply bottom border to ALL columns A through M, but top border only D through I
  for (let c = 1; c <= 13; c++) {
    const letter = worksheet.getColumn(c).letter;
    const isTopBorder = c >= 4 && c <= 9; // Column D to I
    worksheet.getCell(`${letter}${sigRow}`).border = { 
      top: isTopBorder ? { style: 'thin' } : undefined, 
      bottom: { style: 'thin' } 
    };
  }


  sigRow += 3;

  worksheet.getCell(`B${sigRow}`).value = 'PERHITUNGAN SPPD RAMPUNG';
  worksheet.getCell(`B${sigRow}`).font = { name: 'Times New Roman', size: 10 };
  
  worksheet.getCell(`C${sigRow + 1}`).value = '1. Ditetapkan sejumlah';
  worksheet.getCell(`C${sigRow + 1}`).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(`D${sigRow + 1}`).value = `: Rp ${totalKeseluruhan.toLocaleString('id-ID')}`;
  worksheet.getCell(`D${sigRow + 1}`).font = { name: 'Times New Roman', size: 10 };
  
  worksheet.getCell(`C${sigRow + 2}`).value = '2. Yang telah dibayar semula';
  worksheet.getCell(`C${sigRow + 2}`).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(`D${sigRow + 2}`).value = `: Rp 0`;
  worksheet.getCell(`D${sigRow + 2}`).font = { name: 'Times New Roman', size: 10 };

  worksheet.getCell(`C${sigRow + 3}`).value = '3. Sisa kurang/lebih';
  worksheet.getCell(`C${sigRow + 3}`).font = { name: 'Times New Roman', size: 10 };
  worksheet.getCell(`D${sigRow + 3}`).value = `: Rp ${totalKeseluruhan.toLocaleString('id-ID')}`;
  worksheet.getCell(`D${sigRow + 3}`).font = { name: 'Times New Roman', size: 10 };

  worksheet.mergeCells(`L${sigRow + 4}:M${sigRow + 4}`);
  const sigKpa1 = worksheet.getCell(`L${sigRow + 4}`);
  sigKpa1.value = 'Mengetahui/Menyetujui :';
  sigKpa1.font = { name: 'Times New Roman', size: 10 };
  sigKpa1.alignment = { horizontal: 'center' };
  
  worksheet.mergeCells(`L${sigRow + 5}:M${sigRow + 5}`);
  const sigKpa2 = worksheet.getCell(`L${sigRow + 5}`);
  sigKpa2.value = 'Kuasa Pengguna Anggaran';
  sigKpa2.font = { name: 'Times New Roman', size: 10 };
  sigKpa2.alignment = { horizontal: 'center' };

  worksheet.mergeCells(`L${sigRow + 9}:M${sigRow + 9}`);
  const sigKpaName = worksheet.getCell(`L${sigRow + 9}`);
  sigKpaName.value = dataHeader.kpa?.nama || 'Wahid Hasyim';
  sigKpaName.font = { bold: true, name: 'Times New Roman', size: 11, underline: true };
  sigKpaName.alignment = { horizontal: 'center' };
  
  worksheet.mergeCells(`L${sigRow + 10}:M${sigRow + 10}`);
  const sigKpaRole = worksheet.getCell(`L${sigRow + 10}`);
  sigKpaRole.value = dataHeader.kpa?.pangkatGolongan || 'Penata Tk. I / III.d';
  sigKpaRole.font = { name: 'Times New Roman', size: 11 };
  sigKpaRole.alignment = { horizontal: 'center' };
  
  worksheet.mergeCells(`L${sigRow + 11}:M${sigRow + 11}`);
  const sigKpaNip = worksheet.getCell(`L${sigRow + 11}`);
  sigKpaNip.value = dataHeader.kpa?.nip ? `NIP. ${dataHeader.kpa.nip}` : 'NIP. 198202082005021002';
  sigKpaNip.font = { name: 'Times New Roman', size: 11 };
  sigKpaNip.alignment = { horizontal: 'center' };

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Rincian_Dalam_Daerah_${dataHeader.kota}.xlsx`);
};
