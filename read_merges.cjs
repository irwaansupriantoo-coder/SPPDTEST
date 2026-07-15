const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const merges = sheet.match(/<mergeCells.*?>.*?<\/mergeCells>/);
  console.log(merges ? merges[0] : 'no merge cells');
}
test();
