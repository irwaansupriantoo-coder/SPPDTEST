const fs = require('fs');
const JSZip = require('jszip');
fs.readFile('public/Kwitansi_Dalam_Daerah.xlsx', async (err, data) => {
  if (err) throw err;
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const idx = sheet.indexOf('<row r="12"');
  const endIdx = sheet.indexOf('<row r="15"');
  console.log(sheet.substring(idx, endIdx));
});
