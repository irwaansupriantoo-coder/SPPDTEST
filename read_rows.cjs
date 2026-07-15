const fs = require('fs');
const JSZip = require('jszip');
fs.readFile('public/Kwitansi_Dalam_Daerah.xlsx', async (err, data) => {
  if (err) throw err;
  const zip = await JSZip.loadAsync(data);
  const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const rows = sheet.match(/<row r="(\d+)"[^>]*>.*?<\/row>/g);
  for (let r of rows) {
    if (r.includes('row r="10"') || r.includes('row r="11"') || r.includes('row r="12"') || r.includes('row r="13"') || r.includes('row r="14"')) {
      console.log(r);
    }
  }
});
