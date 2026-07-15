const JSZip = require('jszip');
const fs = require('fs');
async function run() {
  const data = fs.readFileSync('public/Kwitansi Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  let sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const cellRegex = new RegExp('(<c r="E9"[^>]*>)([\\s\\S]*?)(</c>)');
  const match = sheet1.match(cellRegex);
  console.log('Match E9:', !!match);
  if(match) {
    let openTag = match[1];
    if (/ t="[^"]*"/.test(openTag)) {
      openTag = openTag.replace(/ t="[^"]*"/, ' t="inlineStr"');
    } else {
      openTag = openTag.replace('>', ' t="inlineStr">');
    }
    console.log('Replaced:', openTag + '<is><t xml:space="preserve">TEST</t></is></c>');
  }
}
run();
