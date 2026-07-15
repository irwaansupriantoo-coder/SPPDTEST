const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    if (zip.file('xl/worksheets/sheet1.xml')) {
      let sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string');
      const match = sheet1.match(/<c r="I20" s="61" t="str"><f>C29<\/f><v[^>]*>.*?<\/v><\/c>/s);
      console.log("Regex match:", match ? match[0] : "Not found");
    }
  } catch (e) {
    console.error(e);
  }
}
test();
