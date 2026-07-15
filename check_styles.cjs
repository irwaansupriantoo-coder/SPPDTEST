const fs = require('fs');
const JSZip = require('jszip');

async function check() {
  const buf = fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const stylesStr = await zip.file('xl/styles.xml').async('string');
  const targetStr = '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left"/></xf>';
  const matches = stylesStr.split(targetStr).length - 1;
  console.log('Count:', matches);
}
check().catch(console.error);
