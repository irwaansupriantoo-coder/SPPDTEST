const JSZip = require('jszip');
const fs = require('fs');
async function run() {
  const data = fs.readFileSync('public/Kwitansi Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const cells = ['H2', 'H3', 'E9', 'E19', 'E10', 'I15', 'I19', 'I20', 'I29', 'I30', 'I31', 'F29', 'F30', 'F31', 'C29', 'C30', 'C31'];
  cells.forEach(c => {
    const m = sheet.match(new RegExp('<c r="' + c + '"[^>]*>'));
    console.log(c + ':', m ? 'FOUND' : 'MISSING');
  });
}
run();
