const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const files = Object.keys(zip.files);
  console.log(files.filter(f => f.includes('drawings')));
}
test();
