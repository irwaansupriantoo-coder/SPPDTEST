const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  try {
    const zip = await JSZip.loadAsync(fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx'));
    const sheet = await zip.file('xl/worksheets/sheet1.xml').async('string');
    // We can't simulate the EXACT export without the actual data, but we can check if my code causes invalid XML by running the replacement logic on the template.
    
    let sheet1 = sheet;
    let maksudOverflowLines = ["Line 1", "Line 2"];
    
    // logic ...
      if (maksudOverflowLines.length > 0) {
        const numLines = maksudOverflowLines.length;
        const row12Match = sheet1.match(/<row r="12".*?<\/row>/);
        if (row12Match) {
          sheet1 = sheet1.replace(/<row r="(\d+)"([^>]*)>(.*?)<\/row>/g, (match, r, attrs, content) => {
            let rowNum = parseInt(r, 10);
            if (rowNum >= 13) {
              const shiftedContent = content.replace(/([A-Z])(\d+)/g, (m, col, rn) => {
                if (parseInt(rn, 10) === rowNum) return `${col}${rowNum + numLines}`;
                return m;
              });
              return `<row r="${rowNum + numLines}"${attrs}>${shiftedContent}</row>`;
            }
            return match;
          });

          const newRows = maksudOverflowLines.map((line, idx) => {
            const rIndex = 13 + idx;
            return row12Match[0]
              .replace(/<c r="E12" s="68" t="s"><v>34<\/v><\/c>/, `<c r="E12" s="68" t="inlineStr"><is><t>${line}</t></is></c>`)
              .replace(/r="12"/g, `r="${rIndex}"`)
              .replace(/<c r="([A-Z])12"(.*?)>/g, `<c r="$1${rIndex}"$2>`);
          }).join('\n');

          sheet1 = sheet1.replace(row12Match[0], `${row12Match[0]}\n${newRows}`);
          
          fs.writeFileSync('test_sheet1.xml', sheet1);
          console.log("Successfully ran replacement. Look at test_sheet1.xml");
        }
      }
      
  } catch (e) {
    console.error(e);
  }
}
test();
