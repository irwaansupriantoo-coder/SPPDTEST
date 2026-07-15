const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('test_output.xlsx');
  console.log("Sheet names:", workbook.SheetNames);
} catch (e) {
  console.error("Error reading file:", e.message);
}
