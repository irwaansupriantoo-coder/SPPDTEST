const ExcelJS = require('exceljs');

async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('a:/IRWAN/SPPD/public/SPPD.xlsx');
  wb.worksheets.forEach(ws => {
    console.log('--- Sheet:', ws.name);
    ws.eachRow((row, r) => {
      row.eachCell((cell, c) => {
        if (cell.value && typeof cell.value === 'string') {
          console.log(`[${cell.address}] = ${cell.value}`);
        } else if (cell.value && cell.value.richText) {
          console.log(`[${cell.address}] = ${cell.value.richText.map(t => t.text).join('')}`);
        }
      });
    });
  });
}
run().catch(console.error);
