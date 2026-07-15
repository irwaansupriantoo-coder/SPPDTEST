const fs = require('fs');

const xml = fs.readFileSync('test_sheet1.xml', 'utf8');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

const isValid = XMLValidator.validate(xml);
if (isValid === true) {
  console.log("XML is VALID");
} else {
  console.log("XML INVALID:", isValid);
}
