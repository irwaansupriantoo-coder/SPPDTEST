const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    if (zip.file('xl/worksheets/sheet1.xml')) {
      const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
      const formulas = sheet.match(/<f.*?>.*?<\/f>/g);
      console.log("Formulas found:\n", formulas ? formulas.join('\n') : "None");
    }
  } catch (e) {
    console.error(e);
  }
}
test();
