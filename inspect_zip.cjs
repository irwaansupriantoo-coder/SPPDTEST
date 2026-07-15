const fs = require('fs');
const JSZip = require('jszip');

async function inspect() {
  const data = fs.readFileSync('public/Kwitansi_Dalam_Daerah.xlsx');
  const zip = await JSZip.loadAsync(data);
  for (const filename of Object.keys(zip.files)) {
    if (filename.endsWith('.xml')) {
      const content = await zip.file(filename).async('string');
      if (content.includes('DELAPAN JUTA') || content.includes('8580000') || content.includes('8,580,000') || content.includes('Hasnawati')) {
        console.log(`Found in: ${filename}`);
        if (content.includes('DELAPAN JUTA')) console.log(`  - Contains DELAPAN JUTA`);
        if (content.includes('8580000')) console.log(`  - Contains 8580000`);
        if (content.includes('8,580,000')) console.log(`  - Contains 8,580,000`);
        if (content.includes('Hasnawati')) console.log(`  - Contains Hasnawati`);
      }
    }
  }
}
inspect().catch(console.error);
