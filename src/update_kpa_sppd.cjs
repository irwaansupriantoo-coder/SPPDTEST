const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/utils/generateSPPD.ts';
let c = fs.readFileSync(file, 'utf-8');

// Update QR Code
c = c.replace(/Nama: HIDAYAT SORANG, S\.P/g, 'Nama: WAHID HASYIM');

// Add a sweep to replace hardcoded KPA data in ALL sheets
const sweepLogic = `
        // Sweep untuk merubah nama KPA yang hardcoded di Excel
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value && typeof cell.value === 'string') {
              let text = cell.value;
              let changed = false;
              if (text.toLowerCase().includes('hidayat sorang')) {
                text = text.replace(/Hidayat Sorang, S\\.T\\., M\\.E\\./gi, 'Wahid Hasyim');
                text = text.replace(/HIDAYAT SORANG, S\\.P/gi, 'WAHID HASYIM');
                text = text.replace(/Hidayat Sorang/gi, 'Wahid Hasyim');
                changed = true;
              }
              if (text.includes('19870408')) {
                text = text.replace(/19870408\\s*200901\\s*1\\s*002/g, '198202082005021002');
                changed = true;
              }
              if (text.includes('Pembina / IVa')) {
                text = text.replace(/Pembina \\/ IVa/g, 'Penata Tk. I / III.d');
                changed = true;
              }
              if (changed) {
                cell.value = text;
              }
            }
          });
        });
`;

// Insert the sweep right after `if (isSPPDSheet) {`
if (!c.includes('Sweep untuk merubah nama KPA')) {
  c = c.replace(/if \(isSPPDSheet\) \{/, `if (isSPPDSheet) {\n${sweepLogic}`);
  
  // Also put it in the else block before the placeholder replacements
  c = c.replace(/let changed = false;/, `let changed = false;
                if (text.toLowerCase().includes('hidayat sorang')) {
                  text = text.replace(/Hidayat Sorang, S\\.T\\., M\\.E\\./gi, 'Wahid Hasyim');
                  text = text.replace(/HIDAYAT SORANG, S\\.P/gi, 'WAHID HASYIM');
                  text = text.replace(/Hidayat Sorang/gi, 'Wahid Hasyim');
                  changed = true;
                }
                if (text.includes('19870408')) {
                  text = text.replace(/19870408\\s*200901\\s*1\\s*002/g, '198202082005021002');
                  changed = true;
                }
                if (text.includes('Pembina / IVa')) {
                  text = text.replace(/Pembina \\/ IVa/g, 'Penata Tk. I / III.d');
                  changed = true;
                }
`);
}

fs.writeFileSync(file, c);
