const fs = require('fs');
let file = 'a:/IRWAN/SPPD/src/app/components/PrintableSPPD.tsx';
let c = fs.readFileSync(file, 'utf-8');

c = c.replace(/Hidayat Sorang, S\.T\., M\.E\./gi, 'WAHID HASYIM');
c = c.replace(/HIDAYAT SORANG, S\.T\., M\.E\./gi, 'WAHID HASYIM');
c = c.replace(/19870408 200901 1 002/g, '198202082005021002');
c = c.replace(/198704082009011002/g, '198202082005021002');
c = c.replace(/Pembina \/ IVa/g, 'Penata Tk. I / III.d');

fs.writeFileSync(file, c);
