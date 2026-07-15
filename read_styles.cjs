const fs = require('fs');
const JSZip = require('jszip');
fs.readFile('public/Kwitansi_Dalam_Daerah.xlsx', async (err, data) => {
  if (err) throw err;
  const zip = await JSZip.loadAsync(data);
  const styles = await zip.file('xl/styles.xml').async('string');
  const xfsStart = styles.indexOf('<cellXfs');
  const xfsEnd = styles.indexOf('</cellXfs>');
  const cellXfs = styles.substring(xfsStart, xfsEnd);
  const matches = cellXfs.match(/<xf[^>]*>.*?<\/xf>|<xf[^>]*\/>/g);
  console.log(matches[68]);
});
