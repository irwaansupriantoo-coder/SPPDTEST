const JSZip = require('jszip');
const fs = require('fs');

async function dumpSheet() {
  const buf = fs.readFileSync('public/Rincian Perjalanan Dinas Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const sharedStrings = await zip.file('xl/sharedStrings.xml').async('string');
  const matches = [...sharedStrings.matchAll(/<si>([\s\S]*?)<\/si>/g)];
  
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  
  // Dump rows 9 to 13
  const rows = sheet.match(/<row r="(9|10|11|12|13)"[^>]*>([\s\S]*?)<\/row>/g);
  if (rows) {
      for(const row of rows) {
          const cells = row.match(/<c r="[A-Z0-9]+"[^>]*>([\s\S]*?)<\/c>/g);
          if (cells) {
              for (const c of cells) {
                  const m = c.match(/<c r="([A-Z0-9]+)"[^>]*>[\s\S]*?<v>(\d+)<\/v>[\s\S]*?<\/c>/);
                  if (m) {
                      let text = m[2];
                      if(c.includes('t="s"')) text = matches[parseInt(m[2])][1].replace(/<[^>]+>/g, '');
                      console.log(m[1], ":", text);
                  }
              }
          }
      }
  }
}
dumpSheet().catch(e => console.log(e.message));
