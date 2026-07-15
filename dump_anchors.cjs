const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  const drawing = await zip.file('xl/drawings/drawing1.xml').async('string');
  const matches = drawing.match(/<xdr:twoCellAnchor>.*?<\/xdr:twoCellAnchor>|<xdr:oneCellAnchor>.*?<\/xdr:oneCellAnchor>/g);
  matches.forEach((m, i) => {
    const fromRow = m.match(/<xdr:from>.*?<xdr:row>(\d+)<\/xdr:row>/)?.[1];
    const toRow = m.match(/<xdr:to>.*?<xdr:row>(\d+)<\/xdr:row>/)?.[1];
    console.log(`Shape ${i}: fromRow=${fromRow}, toRow=${toRow}`);
  });
}
test();
