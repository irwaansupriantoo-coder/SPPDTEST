const fs = require('fs');

const files = [
  'src/app/pages/ArsipSPJBendahara.tsx',
  'src/app/pages/ArsipSPJKPA.tsx',
  'src/app/pages/ArsipSPJPegawai.tsx',
  'src/app/pages/ArsipSPJPengelola.tsx',
  'src/app/pages/ArsipSPJPPTK.tsx',
  'src/app/pages/DashboardBendahara.tsx',
  'src/app/pages/DashboardKPA.tsx',
  'src/app/pages/DashboardPengelola.tsx',
  'src/app/pages/DashboardPPTK.tsx',
  'src/app/pages/Laporan.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('getAllPengajuan()') && !content.includes('getAllPengajuan,')) {
      content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]\.\.\/utils\/supabaseDataStore['"]/, 'import { $1, getAllPengajuan } from "../utils/supabaseDataStore"');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    } else {
      console.log('Skipped', file);
    }
  }
});
