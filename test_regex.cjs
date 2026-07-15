const JSZip = require('jszip');
const fs = require('fs');
async function run() {
  const data = fs.readFileSync('public/Kwitansi Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const cellRegex = new RegExp(`(<c r="I30"[^>]*?)(/>|>[\\s\\S]*?</c>)`);
  const m = sheet.match(cellRegex);
  console.log('I30:', m ? m[0] : 'not found');
  console.log('Group 1 (Open):', m ? m[1] : '');
  console.log('Group 2 (Close/Body):', m ? m[2] : '');
}
run();
