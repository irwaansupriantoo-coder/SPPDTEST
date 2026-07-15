const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/utils/generateSPPD.ts';
let c = fs.readFileSync(file, 'utf-8');

const newSweep = `
        // Sweep untuk merubah nama KPA yang hardcoded di Excel (termasuk rich text)
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value) {
              const replaceText = (text) => {
                let changed = false;
                if (text.toLowerCase().includes('hidayat sorang')) {
                  text = text.replace(/Hidayat Sorang, S\\.T\\., M\\.E\\./gi, 'WAHID HASYIM');
                  text = text.replace(/HIDAYAT SORANG, S\\.T\\., M\\.E\\./gi, 'WAHID HASYIM');
                  text = text.replace(/HIDAYAT SORANG, S\\.P/gi, 'WAHID HASYIM');
                  text = text.replace(/Hidayat Sorang/gi, 'WAHID HASYIM');
                  changed = true;
                }
                if (text.includes('19870408')) {
                  text = text.replace(/19870408\\s*200901\\s*1\\s*002/g, '19820208 200502 1 002');
                  changed = true;
                }
                if (text.includes('Pembina / IVa') || text.includes('Penata Tk I')) {
                  text = text.replace(/Pembina \\/ IVa/g, 'Penata Tk. I / III.d');
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
`;

// Find where the old sweep is and replace it.
// We have it twice: inside isSPPDSheet and in the else block. Let's just do a clean replace using regex.
c = c.replace(/\/\/ Sweep untuk merubah nama KPA yang hardcoded di Excel[\s\S]*?(?=\/\/ Mapping data sesuai permintaan)/, newSweep + '\n          ');

c = c.replace(/\/\/ Fallback mekanisme placeholder untuk sheet lain jika ada[\s\S]*?(?=\}\s*\}\s*const buffer = await workbook\.xlsx\.writeBuffer\(\);)/, 
`// Fallback mekanisme placeholder untuk sheet lain jika ada
          worksheet.eachRow((row) => {
            row.eachCell((cell) => {
              if (cell.value) {
                const replaceText = (text) => {
                  let changed = false;
                  if (text.includes('[NAMA]')) { text = text.replace('[NAMA]', person.nama); changed = true; }
                  if (text.includes('[NIP]')) { text = text.replace('[NIP]', person.nip); changed = true; }
                  if (text.includes('[KOTA_TUJUAN]')) { text = text.replace('[KOTA_TUJUAN]', item.kota); changed = true; }
                  
                  if (text.toLowerCase().includes('hidayat sorang')) {
                    text = text.replace(/Hidayat Sorang, S\\.T\\., M\\.E\\./gi, 'WAHID HASYIM');
                    text = text.replace(/HIDAYAT SORANG, S\\.T\\., M\\.E\\./gi, 'WAHID HASYIM');
                    text = text.replace(/HIDAYAT SORANG, S\\.P/gi, 'WAHID HASYIM');
                    text = text.replace(/Hidayat Sorang/gi, 'WAHID HASYIM');
                    changed = true;
                  }
                  if (text.includes('19870408')) {
                    text = text.replace(/19870408\\s*200901\\s*1\\s*002/g, '19820208 200502 1 002');
                    changed = true;
                  }
                  if (text.includes('Pembina / IVa') || text.includes('Penata Tk I')) {
                    text = text.replace(/Pembina \\/ IVa/g, 'Penata Tk. I / III.d');
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
        `);

fs.writeFileSync(file, c);
