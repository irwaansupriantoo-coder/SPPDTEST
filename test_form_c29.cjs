const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    if (zip.file('xl/worksheets/sheet1.xml')) {
      const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
      const idx = sheet.indexOf('<f>C29</f>');
      console.log(sheet.substring(Math.max(0, idx - 100), idx + 100));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
