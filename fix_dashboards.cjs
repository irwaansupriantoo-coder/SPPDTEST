const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  code = code.replace(
    /import \{ getStatusPengajuan, getTanggalPersetujuan \} from '\.\.\/utils\/statusStore';/,
    "import { batchGetStatusPengajuan, batchGetTanggalPersetujuan } from '../utils/statusStore';"
  );

  // Add state map
  if (code.includes('const [selectedSppd, setSelectedSppd] = useState<any>(null);') && !code.includes('setStatusMapState')) {
    code = code.replace(
      /const \[selectedSppd, setSelectedSppd\] = useState<any>\(null\);/,
      "const [selectedSppd, setSelectedSppd] = useState<any>(null);\n  const [statusMapState, setStatusMapState] = useState<Record<string, string>>({});\n  const [tanggalMapState, setTanggalMapState] = useState<Record<string, string>>({});"
    );
  }

  // Inject batch calls in fetchPengajuan
  code = code.replace(
    /const fetchPengajuan = async \(\) => \{\n\s+try \{\n\s+const res = await apiRequest<\(\{ data: any\[\] \}\)?>\('\/pengajuan'\);\n\s+const pengajuanData = res\.data \|\| \[\];/,
    `const fetchPengajuan = async () => {
    try {
      const res = await apiRequest<{ data: any[] }>('/pengajuan');
      const pengajuanData = res.data || [];
      const allIds = pengajuanData.map((d: any) => d.noSppd || d.no_sppd || '').filter(Boolean);
      const sMap = await batchGetStatusPengajuan(allIds);
      const tMap = await batchGetTanggalPersetujuan(allIds);
      setStatusMapState(sMap);
      setTanggalMapState(tMap);`
  );

  // Replace usages inside fetchPengajuan
  code = code.replace(/getStatusPengajuan\(sppd\)/g, 'sMap[sppd] || "belum_spj"');
  
  // Usages outside fetchPengajuan (in JSX)
  code = code.replace(/const statusPeng = sMap\[sppd\] \|\| "belum_spj";/g, 'const statusPeng = statusMapState[sppd] || "belum_spj";');
  code = code.replace(/getTanggalPersetujuan\(sppdStr\)/g, 'tanggalMapState[sppdStr] || ""');

  fs.writeFileSync(filePath, code);
}

fixFile('src/app/pages/DashboardPPTK.tsx');
fixFile('src/app/pages/DashboardPengelola.tsx');
