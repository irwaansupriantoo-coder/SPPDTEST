const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const xml = fs.readFileSync('test_sheet1.xml');
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    zip.file('xl/worksheets/sheet1.xml', xml);
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync('test_output.xlsx', buffer);
    console.log("Successfully generated test_output.xlsx");
  } catch (e) {
    console.error(e);
  }
}
test();
