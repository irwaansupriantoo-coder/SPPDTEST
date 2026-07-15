const fs = require('fs');
const JSZip = require('jszip');

async function inspect() {
  const data = fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const shared = await zip.file('xl/sharedStrings.xml').async('string');
  
  const cells = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'];
  cells.forEach(c => {
    const regex = new RegExp(`<c r="${c}"[^>]*>(.*?)<\/c>`);
    const match = sheet.match(regex);
    if (match) {
      console.log(`Cell ${c}: ${match[0]}`);
    } else {
      console.log(`Cell ${c} not found`);
    }
  });
}
inspect().catch(console.error);
