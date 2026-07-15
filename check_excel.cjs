const fs = require('fs');
const JSZip = require('jszip');

async function check() {
  const buf = fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string');
  
  // Find which cell has <v>34</v> or check other occurrences
  const matches = sheet1.match(/<c [^>]*><v>34<\/v><\/c>/g);
  console.log("Cells with 34:", matches);
  
  const stylesStr = await zip.file('xl/styles.xml').async('string');
  const cellXfsMatch = stylesStr.match(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/);
  if (cellXfsMatch) {
    const xfs = cellXfsMatch[2].split('</xf>');
    console.log("Style 68:", xfs[68] + '</xf>');
    
    // Test the exact string replacement
    const targetStr = '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left"/></xf>';
    console.log("Does it contain target string?", stylesStr.includes(targetStr));
    
    // See what the replacement actually does
    const replacedStr = stylesStr.replace(targetStr, '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>');
    console.log("Styles changed?", replacedStr !== stylesStr);
  }
}
check().catch(console.error);
