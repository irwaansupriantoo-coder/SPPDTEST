const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const rows = sheet.match(/<row r="(12|13|14)"[^>]*>.*?<\/row>/g);
  console.log(rows.join('\n'));
}
test();
