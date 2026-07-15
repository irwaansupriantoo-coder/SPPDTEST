const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    if (zip.file('xl/workbook.xml')) {
      const wb = await zip.file('xl/workbook.xml').async('string');
      const matches = wb.match(/<definedNames>.*?<\/definedNames>/);
      console.log(matches ? matches[0] : "No definedNames");
    }
  } catch (e) {
    console.error(e);
  }
}
test();
