const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    if (zip.file('xl/calcChain.xml')) {
      const calcChain = await zip.file('xl/calcChain.xml').async('string');
      console.log(calcChain);
    } else {
      console.log("No calcChain.xml found");
    }
  } catch (e) {
    console.error(e);
  }
}
test();
