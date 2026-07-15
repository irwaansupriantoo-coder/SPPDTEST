const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/utils/generateSPPD.ts';
let c = fs.readFileSync(file, 'utf-8');

const kpaAssignments = `
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
`;

if (!c.includes("worksheet.getCell('G43').value = kpaNama;")) {
  c = c.replace(/worksheet\.getCell\('F72'\)\.value = pptkNip;/, 
`worksheet.getCell('F72').value = pptkNip;${kpaAssignments}`);
  fs.writeFileSync(file, c);
}
