const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'app/pages');

const dashboardFiles = [
    'DashboardKPA.tsx',
    'DashboardPengelola.tsx',
    'DashboardPPTK.tsx'
];

const arsipFiles = [
    'ArsipSPJBendahara.tsx',
    'ArsipSPJKPA.tsx',
    'ArsipSPJPegawai.tsx',
    'ArsipSPJPengelola.tsx',
    'ArsipSPJPPTK.tsx',
    'Laporan.tsx'
];

// First Dashboard files
for (const file of dashboardFiles) {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file} - not found`);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // add batchGetStatusPengajuan import
    content = content.replace(/import \{([^}]+)\} from ("|')\.\.\/utils\/statusStore("|');/g, (match, p1, p2, p3) => {
        if (!p1.includes('batchGetStatusPengajuan')) {
            return `import { ${p1.trim()}, batchGetStatusPengajuan } from ${p2}../utils/statusStore${p3};`;
        }
        return match;
    });

    // state for dashboard
    if (!content.includes('const [pengajuanStatuses, setPengajuanStatuses]')) {
        content = content.replace(/(const \[latestPengajuan, setLatestPengajuan\] = useState<.*?\]>\(\[\]\);)/, 
            `$1\n  const [pengajuanStatuses, setPengajuanStatuses] = useState<Record<string, string>>({});`);
    }

    // loadData inject
    if (!content.includes('const statusMap = await batchGetStatusPengajuan')) {
        if (content.includes('const validData = pengajuanData;')) {
             content = content.replace(/const validData = pengajuanData;/, 
                `const validData = pengajuanData;\n        const sppdList = validData.map((d: any) => d.noSppd || d.no_sppd || '').filter(Boolean);\n        const statusMap = await batchGetStatusPengajuan(sppdList);\n        setPengajuanStatuses(statusMap);`);
        }
    }

    // In loops
    content = content.replace(/const status = getStatusPengajuan\(sppd\);/g, 
        `const status = (typeof statusMap !== 'undefined' ? statusMap[sppd] : pengajuanStatuses[sppd]) || 'Menunggu Persetujuan';`);

    content = content.replace(/const statusPeng = getStatusPengajuan\(sppd\);/g, 
        `const statusPeng = pengajuanStatuses[sppd] || 'Menunggu Persetujuan';`);

    fs.writeFileSync(filePath, content);
}

// Arsip files
for (const file of arsipFiles) {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file} - not found`);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // import
    content = content.replace(/import \{([^}]+)\} from ("|')\.\.\/utils\/statusStore("|');/g, (match, p1, p2, p3) => {
        if (!p1.includes('batchGetStatusPengajuan')) {
            return `import { ${p1.trim()}, batchGetStatusPengajuan } from ${p2}../utils/statusStore${p3};`;
        }
        return match;
    });

    // Replace the isApproved logic
    if (!content.includes('const statusMap = await batchGetStatusPengajuan')) {
        content = content.replace(/const isApproved = \(item: (LaporanData|any)\) => \{/, 
            `const sppdList = [...combinedDalam, ...combinedLuar].map((d: any) => d.noSppd).filter(Boolean);\n      const statusMap = await batchGetStatusPengajuan(sppdList);\n\n      const isApproved = (item: $1) => {`);
    }
        
    content = content.replace(/const status = getStatusPengajuan\(item\.noSppd\);/g, 
        `const status = typeof statusMap !== 'undefined' ? statusMap[item.noSppd] || 'Menunggu Persetujuan' : 'Menunggu Persetujuan';`);

    fs.writeFileSync(filePath, content);
}

console.log("Done");
