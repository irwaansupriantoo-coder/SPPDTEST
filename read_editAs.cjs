const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const drawing = await zip.file('xl/drawings/drawing1.xml').async('string');
  const matches = drawing.match(/<xdr:twoCellAnchor[^>]*>/g);
  console.log(matches.join('\n'));
}
test();
