const fs = require('fs');

const filesToUpdate = [
  'a:/IRWAN/SPPD/src/app/utils/exportExcelDalamDaerah.ts',
  'a:/IRWAN/SPPD/src/app/pages/PersetujuanSPJKPA.tsx',
  'a:/IRWAN/SPPD/src/app/pages/ArsipSPJPegawai.tsx',
  'a:/IRWAN/SPPD/src/app/pages/ArsipSPJBendahara.tsx',
  'a:/IRWAN/SPPD/src/app/components/ProfileCard.tsx',
  'a:/IRWAN/SPPD/src/app/components/VerifikasiDokumenDialog.tsx',
  'a:/IRWAN/SPPD/src/app/components/RincianPreviewModal.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');

    // Replace old KPA Name
    content = content.replace(/Hidayat Sorang, S\.T\., M\.E\./g, 'Wahid Hasyim');
    content = content.replace(/Hidayat Sorang, S\.T\., M\.E/g, 'Wahid Hasyim');
    
    // Replace old KPA NIP
    content = content.replace(/19870408 200901 1 002/g, '198202082005021002');
    
    // Replace old KPA Pangkat
    content = content.replace(/Pembina \/ IVa/g, 'Penata Tk. I / III.d');

    fs.writeFileSync(file, content);
  }
});
