const ExcelJS = require('exceljs');
const wb = new ExcelJS.Workbook();
wb.xlsx.readFile('public/Kwitansi_Dalam_Daerah.xlsx').then(() => {
  const ws = wb.worksheets[0];
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value) {
        let val = cell.value;
        if (typeof val === 'object' && val.richText) {
          val = val.richText.map(rt => rt.text).join('');
        }
        console.log(`${cell.address}: ${val}`);
      }
    });
  });
});
