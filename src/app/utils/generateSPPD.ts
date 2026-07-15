import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getSubKegiatanData } from './anggaranStore';

export async function downloadSPPD(item: any) {
  try {
    const response = await fetch('/SPPD.xlsx');
    if (!response.ok) {
      throw new Error('Template SPPD.xlsx tidak ditemukan di server.');
    }
    const arrayBuffer = await response.arrayBuffer();

    for (let i = 0; i < item.pelaksana.length; i++) {
      // Dapatkan data PPTK
      let pptkNama = 'Rahmawati';
      let pptkNip = '199511302022032030';
      let pptkPangkat = 'Penata Muda / III.a';
      
      try {
        const subKList = getSubKegiatanData();
        const subK = subKList.find((s: any) => s.id === item.subKegiatan || s.nama === item.subKegiatan);
        if (subK && subK.pptkNip) {
          if (subK.pptkNip === '199509012022031013') {
            pptkNama = 'Irwan Suprianto';
            pptkNip = '199509012022031013';
            pptkPangkat = 'Penata Muda / III.a';
          } else if (subK.pptkNip === '199511302022032030') {
            pptkNama = 'Rahmawati';
            pptkNip = '199511302022032030';
            pptkPangkat = 'Penata Muda / III.a';
          }
        }
      } catch (e) {
        console.error('Error fetching PPTK data', e);
      }

      const person = item.pelaksana[i];
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      for (const worksheet of workbook.worksheets) {
        // Pengecekan spesifik untuk sheet SPPD (misal: "Dalam")
        const cellB10 = worksheet.getCell('B10').value;
        const cellB10Str = cellB10 ? String(cellB10).toLowerCase() : '';
        const isSPPDSheet = cellB10Str.includes('nama / nip pegawai');

        if (isSPPDSheet) {

        
        // Sweep untuk merubah nama KPA yang hardcoded di Excel (termasuk rich text)
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value) {
              const replaceText = (text) => {
                let changed = false;
                if (text.toLowerCase().includes('hidayat sorang')) {
                  text = text.replace(/Hidayat Sorang, S\.T\., M\.E\./gi, 'WAHID HASYIM');
                  text = text.replace(/HIDAYAT SORANG, S\.T\., M\.E\./gi, 'WAHID HASYIM');
                  text = text.replace(/HIDAYAT SORANG, S\.P/gi, 'WAHID HASYIM');
                  text = text.replace(/Hidayat Sorang/gi, 'WAHID HASYIM');
                  changed = true;
                }
                if (text.includes('19870408')) {
                  text = text.replace(/19870408\s*200901\s*1\s*002/g, '19820208 200502 1 002');
                  changed = true;
                }
                if (text.includes('Pembina / IVa') || text.includes('Penata Tk I')) {
                  text = text.replace(/Pembina \/ IVa/g, 'Penata Tk. I / III.d');
                  text = text.replace(/Penata Tk I/g, 'Penata Tk. I / III.d');
                  changed = true;
                }
                return { text, changed };
              };

              if (typeof cell.value === 'string') {
                const res = replaceText(cell.value);
                if (res.changed) cell.value = res.text;
              } else if (cell.value.richText) {
                let changed = false;
                const newRichText = cell.value.richText.map(rt => {
                   const res = replaceText(rt.text);
                   if (res.changed) changed = true;
                   return { ...rt, text: res.text };
                });
                if (changed) cell.value = { richText: newRichText };
              }
            }
          });
        });

          // Mapping data sesuai permintaan
          worksheet.getCell('F10').value = person.nama || '-';
          worksheet.getCell('F11').value = person.nip || '-';
          worksheet.getCell('G12').value = person.pangkat || 'Penata Muda / III.a';
          worksheet.getCell('G13').value = person.jabatan || 'Staf Pelaksana';
          const maksud = item.keperluan || 'Perjalanan Dinas';
          worksheet.getCell('F15').value = maksud;
          
          // Formatting Sel E12 Untuk maksud perjalanan dinas
          const cellE12 = worksheet.getCell('E12');
          cellE12.value = maksud;
          const maksudWords = maksud.split(/\s+/).filter((w: string) => w.length > 0);
          if (maksudWords.length > 10) {
            cellE12.alignment = { ...cellE12.alignment, wrapText: true };
            worksheet.getRow(12).height = 25;
          }
          cellE12.font = { ...cellE12.font, name: 'Cambria' };

          worksheet.getCell('F19').value = item.alatAngkut || 'Kendaraan Darat';
          
          const kotaAsal = item.kotaAsal || 'Tanjung Redeb';
          worksheet.getCell('G20').value = kotaAsal;
          worksheet.getCell('G21').value = item.kota || '-';
          
          // Helper format tanggal Indonesia
          const formatDateId = (dateStr: string) => {
            if (!dateStr || dateStr === '-') return '-';
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
          };

          worksheet.getCell('I37').value = formatDateId(item.tanggalPersetujuan || item.tanggalPengajuan || '-');
          worksheet.getCell('I61').value = kotaAsal;
          worksheet.getCell('I63').value = item.kota || '-';

          worksheet.getCell('I64').value = formatDateId(item.tanggalPergi);

          // Hitung lama hari
          let lamaHari = 1;
          if (item.tanggalPergi && item.tanggalKembali) {
            const start = new Date(item.tanggalPergi).getTime();
            const end = new Date(item.tanggalKembali).getTime();
            lamaHari = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
          }

          worksheet.getCell('G22').value = `${lamaHari} Hari`;
          worksheet.getCell('G23').value = formatDateId(item.tanggalPergi);
          worksheet.getCell('G24').value = formatDateId(item.tanggalKembali);
          
          worksheet.getCell('D101').value = kotaAsal;
          worksheet.getCell('D102').value = formatDateId(item.tanggalKembali);

          // A7: Format Nomor SPPD
          const sppdRaw = item.noSppd || '';
          const parts = sppdRaw.split('/');
          let sppdClean = sppdRaw;
          let fileId = sppdRaw;

          if (parts.length >= 2) {
            const baseNum = parseInt(parts[1], 10);
            if (!isNaN(baseNum)) {
              const currentNum = baseNum + i;
              const paddedNum = String(currentNum).padStart(5, '0');
              sppdClean = `${parts[0]}/${paddedNum}/DKPP-KUMKM.3 / SPD`;
              fileId = paddedNum;
            } else {
              sppdClean = `${parts[0]}/${parts[1]}/DKPP-KUMKM.3 / SPD`;
              fileId = parts[1];
            }
          }
          worksheet.getCell('A7').value = `Nomor : ${sppdClean}`;
          // Simpan fileId agar bisa diakses di luar iterasi worksheet
          (workbook as any).__fileId = fileId;

          worksheet.getCell('G33').value = item.kodeRekening || '-';
          // Sel PPTK F70, F71, F72
          worksheet.getCell('F70').value = pptkNama;
          worksheet.getCell('F71').value = pptkPangkat;
          worksheet.getCell('F72').value = pptkNip;
          // Sel KPA G43, G44, G45 & B107, B108, B109
          const kpaNama = 'Wahid Hasyim';
          const kpaPangkat = 'Penata Tk. I / III.d';
          const kpaNip = '198202082005021002';
          
          worksheet.getCell('G43').value = kpaNama;
          worksheet.getCell('G44').value = kpaPangkat;
          worksheet.getCell('G45').value = kpaNip;
          
          worksheet.getCell('B107').value = kpaNama;
          worksheet.getCell('B108').value = kpaPangkat;
          worksheet.getCell('B109').value = kpaNip;



          // Generate QR Code untuk tanda tangan KPA
          try {
            const qrData = `Disetujui secara elektronik oleh:\nNama: WAHID HASYIM\nJabatan: Kepala Bidang Koperasi dan UKM\nNo. SPPD: ${sppdClean}\nTanggal: ${formatDateId(item.tanggalPersetujuan || item.tanggalPengajuan)}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
            
            const qrResponse = await fetch(qrUrl);
            const qrBuffer = await qrResponse.arrayBuffer();
            
            const imageId = workbook.addImage({
              buffer: qrBuffer,
              extension: 'png',
            });
            
            worksheet.addImage(imageId, {
              tl: { col: 7.3, row: 39.2 }, // Geser ke kolom H/I dan baris 40
              ext: { width: 55, height: 55 }
            });
          } catch (qrErr) {
            console.warn("Gagal membuat QR Code", qrErr);
          }

        } else {
          // Fallback mekanisme placeholder untuk sheet lain jika ada
          worksheet.eachRow((row) => {
            row.eachCell((cell) => {
              if (cell.value) {
                const replaceText = (text) => {
                  let changed = false;
                  if (text.includes('[NAMA]')) { text = text.replace('[NAMA]', person.nama); changed = true; }
                  if (text.includes('[NIP]')) { text = text.replace('[NIP]', person.nip); changed = true; }
                  if (text.includes('[KOTA_TUJUAN]')) { text = text.replace('[KOTA_TUJUAN]', item.kota); changed = true; }
                  
                  if (text.toLowerCase().includes('hidayat sorang')) {
                    text = text.replace(/Hidayat Sorang, S\.T\., M\.E\./gi, 'WAHID HASYIM');
                    text = text.replace(/HIDAYAT SORANG, S\.T\., M\.E\./gi, 'WAHID HASYIM');
                    text = text.replace(/HIDAYAT SORANG, S\.P/gi, 'WAHID HASYIM');
                    text = text.replace(/Hidayat Sorang/gi, 'WAHID HASYIM');
                    changed = true;
                  }
                  if (text.includes('19870408')) {
                    text = text.replace(/19870408\s*200901\s*1\s*002/g, '19820208 200502 1 002');
                    changed = true;
                  }
                  if (text.includes('Pembina / IVa') || text.includes('Penata Tk I')) {
                    text = text.replace(/Pembina \/ IVa/g, 'Penata Tk. I / III.d');
                    text = text.replace(/Penata Tk I/g, 'Penata Tk. I / III.d');
                    changed = true;
                  }
                  return { text, changed };
                };
  
                if (typeof cell.value === 'string') {
                  const res = replaceText(cell.value);
                  if (res.changed) cell.value = res.text;
                } else if (cell.value.richText) {
                  let changed = false;
                  const newRichText = cell.value.richText.map(rt => {
                     const res = replaceText(rt.text);
                     if (res.changed) changed = true;
                     return { ...rt, text: res.text };
                  });
                  if (changed) cell.value = { richText: newRichText };
                }
              }
            });
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const safeName = person.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const fId = (workbook as any).__fileId || item.noSppd;
      saveAs(blob, `SPPD_${fId}_${safeName}.xlsx`);
    }

    return true;
  } catch (error) {
    console.error('Download SPPD Error:', error);
    throw error;
  }
}
