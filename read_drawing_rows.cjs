const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const drawing = await zip.file('xl/drawings/drawing1.xml').async('string');
  console.log(drawing.match(/<xdr:row>(\d+)<\/xdr:row>/g).join(', '));
}
test();
