const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('| "menunggu_verifikasi_bendahara"')) {
      content = content.replace(/\| "menunggu_verifikasi_bendahara"/g, '| "menunggu_verifikasi_pegawai"\n    | "menunggu_verifikasi_bendahara"');
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated LaporanData in ' + filePath);
    }
  }
});
