const fs = require('fs');

const xml = fs.readFileSync('test_sheet1.xml', 'utf8');

const rows = xml.match(/<row r="12".*?<\/row>\n<row r="13".*?<\/row>\n<row r="14".*?<\/row>/);
console.log(rows ? rows[0] : "Not found!");
