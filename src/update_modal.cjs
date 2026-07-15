const fs = require('fs');
let file = 'a:/IRWAN/SPPD/src/app/components/SppdPreviewModal.tsx';
let c = fs.readFileSync(file, 'utf-8');

c = c.replace(/Hidayat Sorang, S\.T\., M\.E\./gi, 'Wahid Hasyim');
c = c.replace(/HIDAYAT SORANG, S\.P/gi, 'WAHID HASYIM');
c = c.replace(/HIDAYAT SORANG/gi, 'WAHID HASYIM');
c = c.replace(/Hidayat Sorang/gi, 'Wahid Hasyim');
c = c.replace(/19870408 200901 1 002/g, '198202082005021002');
c = c.replace(/198704082009011002/g, '198202082005021002');
c = c.replace(/Pembina \/ IVa/g, 'Penata Tk. I / III.d');

// Let's also check if PPTK is hardcoded here (Rahmawati, S.E. -> Rahmawati)
c = c.replace(/Rahmawati, S\.E\./gi, 'Rahmawati');
c = c.replace(/19951130 202203 2 030/g, '199511302022032030');

fs.writeFileSync(file, c);
