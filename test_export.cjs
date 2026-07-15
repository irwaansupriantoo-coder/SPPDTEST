const JSZip = require('jszip');
const fs = require('fs');

async function run() {
  const data = fs.readFileSync('public/Kwitansi Luar Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);

  const dataMapping = {
    'H2': 'NEW_H2_VALUE',
    'E9': 'NEW_E9_VALUE',
    'I30': 'NEW_I30_VALUE'
  };

  let sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string');
  
  for (const [cellRef, value] of Object.entries(dataMapping)) {
    const cellRegex = new RegExp(`(<c r="${cellRef}"[^>]*?)(/>|>[\\s\\S]*?</c>)`);
    const match = sheet1.match(cellRegex);
    if (match) {
      let openTag = match[1];
      
      if (typeof value === 'number') {
        openTag = openTag.replace(/\s*t="[^"]*"/, '');
        sheet1 = sheet1.replace(cellRegex, `${openTag}><v>${value}</v></c>`);
      } else {
        if (/ t="[^"]*"/.test(openTag)) {
          openTag = openTag.replace(/ t="[^"]*"/, ' t="inlineStr"');
        } else {
          openTag = openTag + ' t="inlineStr"';
        }
        const safeVal = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sheet1 = sheet1.replace(cellRegex, `${openTag}><is><t xml:space="preserve">${safeVal}</t></is></c>`);
      }
    } else {
      console.log(`Cell ${cellRef} NOT FOUND`);
    }
  }

  sheet1 = sheet1.replace(/<f>[^<]*<\/f>/g, '');
  zip.file('xl/worksheets/sheet1.xml', sheet1);
  zip.remove('xl/calcChain.xml');
  
  let contentTypes = await zip.file('[Content_Types].xml').async('string');
  contentTypes = contentTypes.replace(/<Override PartName="\/xl\/calcChain.xml"[^/]*\/>/, '');
  zip.file('[Content_Types].xml', contentTypes);

  const outBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync('test_out.xlsx', outBuffer);
  console.log('Saved to test_out.xlsx');
}
run();
