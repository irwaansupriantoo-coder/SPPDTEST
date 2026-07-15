const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'a:/IRWAN/SPPD/src/app/pages/ArsipSPJPegawai.tsx',
  'a:/IRWAN/SPPD/src/app/pages/ArsipSPJBendahara.tsx',
  'a:/IRWAN/SPPD/src/app/pages/PersetujuanSPJPPTK.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');

    // Replace signPdf calls for PPTK
    content = content.replace(/"PPTK", "Rahmawati, S\.E\.", "19951130 202203 2 030"/g, 
                              '"PPTK", "Rahmawati", "199511302022032030"');

    // If there is any KPA signPdf, update it too
    content = content.replace(/"KPA", "Hidayat Sorang, S\.T\., M\.E\.", "19870408 200901 1 002"/g, 
                              '"KPA", "Wahid Hasyim", "198202082005021002"');

    // If there is any Bendahara signPdf
    content = content.replace(/"Bendahara", "Wenry Adeputra, S\.E\.", "19910627 202321 1 019"/g, 
                              '"Bendahara", "Wenry Adeputra", "199106272023211019"');

    fs.writeFileSync(file, content);
  }
});
