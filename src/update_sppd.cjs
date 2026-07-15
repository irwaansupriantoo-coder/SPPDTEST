const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/utils/generateSPPD.ts';
let c = fs.readFileSync(file, 'utf-8');

// Add import
if (!c.includes('getSubKegiatanData')) {
  c = c.replace(/import \{ saveAs \} from 'file-saver';/, 
`import { saveAs } from 'file-saver';
import { getSubKegiatanData } from './anggaranStore';`);
}

// Find where to insert the PPTK logic
// Inside the `for (let i = 0; i < item.pelaksana.length; i++) {`
const logicToInsert = `
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
`;

if (!c.includes('Dapatkan data PPTK')) {
  c = c.replace(/for \(let i = 0; i < item\.pelaksana\.length; i\+\+\) \{/, 
`for (let i = 0; i < item.pelaksana.length; i++) {${logicToInsert}`);
}

// Now insert the worksheet assignments
const assignments = `
          // Sel PPTK F70, F71, F72
          worksheet.getCell('F70').value = pptkNama;
          worksheet.getCell('F71').value = pptkPangkat;
          worksheet.getCell('F72').value = pptkNip;
`;

if (!c.includes("worksheet.getCell('F70').value")) {
  c = c.replace(/worksheet\.getCell\('G33'\)\.value = item\.kodeRekening \|\| '-';/,
`worksheet.getCell('G33').value = item.kodeRekening || '-';${assignments}`);
}

fs.writeFileSync(file, c);
