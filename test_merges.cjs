const fs = require('fs');
const xml = fs.readFileSync('test_sheet1.xml', 'utf8');

const mergesMatch = xml.match(/<mergeCells.*?<\/mergeCells>/);
if (mergesMatch) {
  console.log(mergesMatch[0]);
} else {
  console.log("No merge cells found");
}
