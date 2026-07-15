import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

export async function exportRincianExcel(
  pelaksana: any,
  sppdData: any,
  rincianData: any
) {
  // 1. Fetch template
  const response = await fetch('/Rincian Perjalanan Dinas Luar Daerah.xlsx');
  if (!response.ok) {
    throw new Error('Gagal mengunduh template Rincian Perjalanan Dinas Luar Daerah.xlsx. Pastikan file ada di folder public.');
  }
  const arrayBuffer = await response.arrayBuffer();

  // 2. Load workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];

  // Helper to safely set cell value
  const setCell = (cellRef: string, value: any) => {
    const cell = worksheet.getCell(cellRef);
    if (cell) cell.value = value;
  };

  // Hardcoded pejabat for now (matches VerifikasiDokumenDialog.tsx)
  const kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };
  const bendahara = { nama: 'Wenry Adeputra', nip: '199106272023211019', pangkatGolongan: 'IX' };
  const pptk = { nama: 'Rahmawati', nip: '199511302022032030', pangkatGolongan: 'Penata Muda / III.a' };

  // 3. Fill the cells BEFORE ANY DELETION

  // -- Identitas Laporan --
  setCell('F3', sppdData.noSppd || '');
  setCell('F4', formatDateIndo(sppdData.tanggalPergi) || '');

  // -- Tanda Tangan & Pejabat (NEW TEMPLATE COORDINATES) --
  setCell('H30', `Tanjung Redeb, ${formatDateIndo(new Date())}`); // Tanggal unduh

  // PPTK
  setCell('H33', '@@@');
  setCell('H35', pptk.nama);
  setCell('H36', pptk.pangkatGolongan);
  setCell('H37', pptk.nip);

  // KPA / Kepala Bidang
  setCell('C33', '@@@@');
  setCell('C35', kpa.nama);
  setCell('C36', kpa.pangkatGolongan);
  setCell('C37', `NIP. ${kpa.nip}`);

  // Pelaku Perjalanan (Yang Bepergian)
  setCell('B45', '#');
  setCell('B47', pelaksana.nama);
  setCell('B48', pelaksana.pangkatGolongan || 'Penata Muda / III.a');
  setCell('B49', `NIP. ${pelaksana.nip}`);

  // Bendahara
  setCell('H45', '@@');
  setCell('H47', bendahara.nama);
  setCell('H48', bendahara.pangkatGolongan);
  setCell('H49', `NIP. ${bendahara.nip}`);
  
  // Tanggal Kwitansi
  setCell('H40', `Pada Tanggal ${formatDateIndo(new Date())}`);


  // -- Row 26-28: Totals --
  setCell('H26', calculateTotal(rincianData));
  setCell('H27', rincianData.panjar || 0);
  setCell('H28', rincianData.sisa || 0);

  // -- Row 24-25: Biaya Tol --
  const tol = rincianData.biayaTol || {};
  setCell('B24', 'Biaya Tol');
  if (tol.enabled) {
    setCell('C25', `Biaya Tol ${tol.keterangan || ''}`);
    setCell('H25', parseInt(tol.total?.toString().replace(/[^0-9]/g, '')) || 0);
    setCell('I25', '');
  }

  // -- Row 22-23: Tiket Kereta Api --
  const kereta = rincianData.keretaApi || {};
  setCell('B22', 'Tiket Kereta Api');
  if (kereta.enabled) {
    setCell('C23', `Tiket Kereta Api ${kereta.tempatBerangkat || ''} - ${kereta.tempatTujuan || ''}`);
    setCell('H23', kereta.subtotal || 0);
    setCell('I23', kereta.keterangan || '');
  }

  // -- Row 19-21: Sewa Kendaraan --
  const sewa = rincianData.sewaKendaraan || {};
  setCell('B19', 'Sewa Kendaraan');
  if (sewa.enabled) {
    setCell('C20', `Sewa Kendaraan dari ${sewa.tempatBerangkat || ''} ke ${sewa.tempatTujuan || ''}`);
    setCell('C21', sewa.lamaSewa || 0);
    setCell('E21', parseInt(sewa.hargaPerHari?.toString().replace(/[^0-9]/g, '')) || 0);
    setCell('H21', sewa.subtotal || 0);
    setCell('I21', `${sewa.lamaSewa || 0} Hari`);
  }

  // -- Row 17-18: Biaya Representatif --
  const rep = rincianData.biayaRepresentatif || {};
  setCell('B17', 'Biaya Representatif');
  if (rep.enabled) {
    setCell('C18', rep.lamaHari || 0);
    setCell('E18', parseInt(rep.standarBiaya?.toString().replace(/[^0-9]/g, '')) || 0);
    setCell('H18', rep.subtotal || 0);
    setCell('I18', `${rep.lamaHari || 0} Hari`);
  }

  // -- Row 14-16: Taxi Bandara --
  setCell('B14', 'Taxi Bandara');
  const taxi = rincianData.taxiBandara || {};
  let deleteTaxiPulang = false;
  let deleteTaxiPergi = false;

  if (taxi.enabled) {
    if (taxi.tipe === 'PP' || taxi.tipe === 'Pulang') {
      setCell('C16', `Taxi ${taxi.tempatBerangkatPulang || ''} - ${taxi.tempatTujuanPulang || ''} (Pulang)`);
      setCell('H16', parseInt(taxi.hargaPulang?.toString().replace(/[^0-9]/g, '')) || 0);
      setCell('I16', taxi.kodeTiketPulang || '');
    } else {
      deleteTaxiPulang = true;
    }

    if (taxi.tipe === 'PP' || taxi.tipe === 'Pergi') {
      setCell('C15', `Taxi ${taxi.tempatBerangkatPergi || ''} - ${taxi.tempatTujuanPergi || ''} (Pergi)`);
      setCell('H15', parseInt(taxi.hargaPergi?.toString().replace(/[^0-9]/g, '')) || 0);
      setCell('I15', taxi.kodeTiketPergi || '');
    } else {
      deleteTaxiPergi = true;
    }
  } else {
    deleteTaxiPulang = true;
    deleteTaxiPergi = true;
  }

  // -- Row 12-13: Biaya Penginapan --
  setCell('B12', 'Biaya Penginapan');
  if (rincianData.totalBiayaHotel > 0) {
    const malam = Math.max(0, (rincianData.jumlahHari || 1) - 1);
    const hotelPerMalam = rincianData.totalBiayaHotel / (malam || 1);
    setCell('C13', `${malam} Malam`);
    setCell('E13', hotelPerMalam);
    setCell('H13', rincianData.totalBiayaHotel);
    setCell('I13', rincianData.namaHotel || 'Hotel'); 
  }

  // -- Row 10-11: Biaya Lumpsum --
  setCell('B10', 'Biaya Lumpsum');
  setCell('C11', `${rincianData.jumlahHari || 0} Hari`);
  setCell('E11', (rincianData.totalUangHarian || 0) / (rincianData.jumlahHari || 1));
  setCell('H11', rincianData.totalUangHarian || 0);
  setCell('I11', `${rincianData.jumlahHari || 0} Hari`);

  // -- Row 7-9: Tiket Pesawat Terbang --
  setCell('B7', 'Tiket Pesawat Terbang');
  const pesawat = rincianData.pesawat || {};
  let deletePesawatPulang = false;
  let deletePesawatPergi = false;

  if (pesawat.enabled) {
    if (pesawat.tipe === 'PP' || pesawat.tipe === 'Pulang') {
      setCell('C9', `Tiket Pesawat ${pesawat.tempatBerangkatPulang || ''} - ${pesawat.tempatTujuanPulang || ''} (Pulang)`);
      setCell('H9', parseInt(pesawat.hargaPulang?.toString().replace(/[^0-9]/g, '')) || 0);
      setCell('I9', pesawat.kodeBookingPulang || '');
    } else {
      deletePesawatPulang = true;
    }

    if (pesawat.tipe === 'PP' || pesawat.tipe === 'Pergi') {
      setCell('C8', `Tiket Pesawat ${pesawat.tempatBerangkatPergi || ''} - ${pesawat.tempatTujuanPergi || ''} (Pergi)`);
      setCell('H8', parseInt(pesawat.hargaPergi?.toString().replace(/[^0-9]/g, '')) || 0);
      setCell('I8', pesawat.kodeBookingPergi || '');
    } else {
      deletePesawatPergi = true;
    }
  } else {
    deletePesawatPulang = true;
    deletePesawatPergi = true;
  }

  // 4. Delete Rows (From Bottom to Top, just by hiding them)
  
  if (!tol.enabled) {
    worksheet.getRow(25).hidden = true;
    worksheet.getRow(24).hidden = true;
  }
  if (!kereta.enabled) {
    worksheet.getRow(23).hidden = true;
    worksheet.getRow(22).hidden = true;
  }
  if (!sewa.enabled) {
    worksheet.getRow(21).hidden = true;
    worksheet.getRow(20).hidden = true;
    worksheet.getRow(19).hidden = true;
  }
  if (!rep.enabled) {
    worksheet.getRow(18).hidden = true;
    worksheet.getRow(17).hidden = true;
  }

  // Taxi
  if (deleteTaxiPulang) worksheet.getRow(16).hidden = true;
  if (deleteTaxiPergi) worksheet.getRow(15).hidden = true;
  if (!taxi.enabled) worksheet.getRow(14).hidden = true; // hide header
  
  // Penginapan
  if (!(rincianData.totalBiayaHotel > 0)) {
    worksheet.getRow(13).hidden = true;
    worksheet.getRow(12).hidden = true;
  }

  // Pesawat
  if (deletePesawatPulang) worksheet.getRow(9).hidden = true;
  if (deletePesawatPergi) worksheet.getRow(8).hidden = true;
  if (!pesawat.enabled) worksheet.getRow(7).hidden = true; // hide header

  // 5. Replace Signatures / Names (just in case they were used as placeholders instead of hardcoded coordinates)
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string') {
        let val = cell.value;
        if (val.includes('[NAMA_PELAKSANA]') || val.toLowerCase().includes('nama pelaksana')) {
          cell.value = val.replace(/\[NAMA_PELAKSANA\]/gi, pelaksana.nama);
        }
        if (val.includes('[NIP_PELAKSANA]')) {
          cell.value = val.replace(/\[NIP_PELAKSANA\]/gi, pelaksana.nip);
        }
      }
    });
  });

  // Export File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Rincian_Perjalanan_Dinas_${pelaksana.nama.replace(/\\s+/g, '_')}.xlsx`);
}

function calculateTotal(rincianData: any) {
  let total = (rincianData.totalUangHarian || 0) + (rincianData.totalBiayaHotel || 0);
  if (rincianData.sewaKendaraan?.enabled) total += rincianData.totalSewaKendaraan || 0;
  if (rincianData.pesawat?.enabled) total += rincianData.totalPesawat || 0;
  if (rincianData.keretaApi?.enabled) total += rincianData.totalKeretaApi || 0;
  if (rincianData.biayaTol?.enabled) total += rincianData.totalBiayaTol || 0;
  if (rincianData.taxiBandara?.enabled) total += rincianData.totalTaxiBandara || 0;
  if (rincianData.biayaRepresentatif?.enabled) total += rincianData.totalBiayaRepresentatif || 0;
  return total;
}
