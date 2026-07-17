const fs = require('fs');

function fixPersetujuanPegawai() {
  const filePath = 'src/app/pages/PersetujuanSPJPegawai.tsx';
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace import
  code = code.replace(
    /import \{ getStatusPengajuan, getPegawaiApprovals, addPegawaiApproval \} from "\.\.\/utils\/statusStore";/,
    `import { getStatusPengajuan, getPegawaiApprovals, addPegawaiApproval, batchGetPegawaiApprovals, batchGetStatusPengajuan } from "../utils/statusStore";`
  );

  // Add state map
  if (!code.includes('const [pegawaiApprovalsMap, setPegawaiApprovalsMap]')) {
    code = code.replace(
      /const \[selectedSppd, setSelectedSppd\] = useState<LaporanData \| null>\(null\);/,
      `const [selectedSppd, setSelectedSppd] = useState<LaporanData | null>(null);\n  const [pegawaiApprovalsMap, setPegawaiApprovalsMap] = useState<Record<string, string[]>>({});\n  const [statusMapState, setStatusMapState] = useState<Record<string, string>>({});`
    );
  }

  // Inject batch calls in loadData
  code = code.replace(
    /const allSppdIds = validData.map\(\(d\) => d\.noSppd\);/,
    `const allSppdIds = validData.map((d) => d.noSppd);
      const approvalsMap = await batchGetPegawaiApprovals(allSppdIds);
      setPegawaiApprovalsMap(approvalsMap);
      const statusMap = await batchGetStatusPengajuan(allSppdIds);
      setStatusMapState(statusMap);`
  );

  // Update getPegawaiApprovals usage
  code = code.replace(/getPegawaiApprovals\(d\.noSppd\)/g, '(pegawaiApprovalsMap[d.noSppd] || [])');
  code = code.replace(/getPegawaiApprovals\(item\.noSppd\)/g, '(pegawaiApprovalsMap[item.noSppd] || [])');

  // We should also replace getStatusPengajuan
  code = code.replace(/getStatusPengajuan\(item\.noSppd\)/g, '(statusMapState[item.noSppd] || "belum_spj")');

  fs.writeFileSync(filePath, code);
}

fixPersetujuanPegawai();
