const JSZip = require('jszip');
const fs = require('fs');
async function run() {
  const data = fs.readFileSync('public/Kwitansi Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const m = sheet.match(/<c r="I30"[^>]*>[\s\S]*?<\/c>/);
  console.log('I30:', m ? m[0] : 'not found');
  const m2 = sheet.match(/<c r="H2"[^>]*>[\s\S]*?<\/c>/);
  console.log('H2:', m2 ? m2[0] : 'not found');
}
run();
