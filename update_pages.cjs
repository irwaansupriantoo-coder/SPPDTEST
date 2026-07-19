const fs = require('fs');
const targetFiles = [
  'src/app/pages/ArsipSPJBendahara.tsx',
  'src/app/pages/ArsipSPJKPA.tsx',
  'src/app/pages/ArsipSPJPegawai.tsx',
  'src/app/pages/ArsipSPJPengelola.tsx',
  'src/app/pages/ArsipSPJPPTK.tsx',
  'src/app/pages/DashboardBendahara.tsx',
  'src/app/pages/DashboardKPA.tsx',
  'src/app/pages/DashboardPengelola.tsx',
  'src/app/pages/DashboardPPTK.tsx',
  'src/app/pages/Laporan.tsx',
];

for (const file of targetFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  
  if (content.includes("apiRequest<{ data: LaporanData[] }>('/pengajuan')")) {
    content = content.replace(/const \{ data \} = await apiRequest<\{ data: LaporanData\[\] \}>\(\'\/pengajuan\'\);/g, 'const data = await getAllPengajuan();');
    changed = true;
  }
  
  if (content.includes("apiRequest<{ data: any[] }>('/pengajuan')")) {
    content = content.replace(/const res = await apiRequest<\{ data: any\[\] \}>\(\'\/pengajuan\'\);/g, 'const data = await getAllPengajuan();\n      const res = { data };');
    changed = true;
  }

  if (content.includes("const res = await apiRequest<{ data: LaporanData[] }>('/pengajuan')")) {
    content = content.replace(/const res = await apiRequest<\{ data: LaporanData\[\] \}>\(\'\/pengajuan\'\);/g, 'const data = await getAllPengajuan();\n          const res = { data };');
    changed = true;
  }
  
  if (changed) {
    if (!content.includes('getAllPengajuan')) {
       // Append import at the top
       content = `import { getAllPengajuan } from "../utils/supabaseDataStore";\n` + content;
    }
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
console.log('Done');
