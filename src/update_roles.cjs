const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'a:/IRWAN/SPPD/src/app/utils/exportRincianExcel.ts',
  'a:/IRWAN/SPPD/src/app/utils/exportKwitansiLuarDaerah.ts',
  'a:/IRWAN/SPPD/src/app/components/VerifikasiDokumenDialog.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');

    // Replace KPA
    content = content.replace(/const kpa = \{ nama: 'Hidayat Sorang, S\.T\., M\.E\.', nip: '19870408 200901 1 002', pangkatGolongan: 'Pembina \/ IVa' \};/g, 
                              "const kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };");
    content = content.replace(/let kpa = \{ nama: 'Hidayat Sorang, S\.T\., M\.E\.', nip: '19870408 200901 1 002', pangkatGolongan: 'Pembina \/ IVa' \};/g, 
                              "let kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };");

    // Replace Bendahara
    content = content.replace(/const bendahara = \{ nama: 'Wenry Adeputra, S\.E\.', nip: '19910627 202321 1 019', pangkatGolongan: '- \/ IX' \};/g, 
                              "const bendahara = { nama: 'Wenry Adeputra', nip: '199106272023211019', pangkatGolongan: 'IX' };");
    content = content.replace(/let bendahara = \{ nama: 'Wenry Adeputra, S\.E\.', nip: '19910627 202321 1 019', pangkatGolongan: '- \/ IX' \};/g, 
                              "let bendahara = { nama: 'Wenry Adeputra', nip: '199106272023211019', pangkatGolongan: 'IX' };");

    // Replace PPTK
    content = content.replace(/const pptk = \{ nama: 'Rahmawati, S\.E\.', nip: '19951130 202203 2 030', pangkatGolongan: 'Penata Muda Tk\. I \/ III\.b' \};/g, 
                              "const pptk = { nama: 'Rahmawati', nip: '199511302022032030', pangkatGolongan: 'Penata Muda / III.a' };");
    content = content.replace(/let pptk = \{ nama: 'Rahmawati, S\.E\.', nip: '19951130 202203 2 030', pangkatGolongan: 'Penata Muda Tk\. I \/ III\.b' \};/g, 
                              "let pptk = { nama: 'Rahmawati', nip: '199511302022032030', pangkatGolongan: 'Penata Muda / III.a' };");

    fs.writeFileSync(file, content);
  }
});
