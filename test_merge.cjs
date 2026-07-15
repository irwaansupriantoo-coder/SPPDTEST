const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
  let sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const mergeStart = sheet.indexOf('<mergeCells');
  const mergeEnd = sheet.indexOf('</mergeCells>');
  if (mergeStart !== -1) {
    console.log(sheet.substring(mergeStart, mergeEnd + 13));
  } else {
    console.log("No mergeCells");
  }
}
test();
