const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/pages/PersetujuanSPJPegawai.tsx';
let c = fs.readFileSync(file, 'utf-8');

c = c.replace(/PersetujuanSPJBendahara/g, 'PersetujuanSPJPegawai');
c = c.replace(/Dashboard Bendahara/g, 'Dashboard Pegawai');
c = c.replace(/Persetujuan SPJ oleh Bendahara/g, 'Persetujuan SPJ oleh Pegawai');

// Change the expected status for the list
c = c.replace(/d.status === "menunggu_verifikasi_bendahara"/g, 'd.status === "menunggu_verifikasi_pegawai" && d.pelaksana.some(p => p.nip === user.nip)');

// When mapping items to correct status type initially
c = c.replace(/status: "menunggu_verifikasi_bendahara" as const/g, 'status: "menunggu_verifikasi_pegawai" as const');

// Status counts
c = c.replace(/stats.menunggu_verifikasi_bendahara/g, 'stats.menunggu_verifikasi_pegawai');
c = c.replace(/menunggu_verifikasi_bendahara: filteredData.filter/g, 'menunggu_verifikasi_pegawai: filteredData.filter');
c = c.replace(/item.status === "menunggu_verifikasi_bendahara"/g, 'item.status === "menunggu_verifikasi_pegawai"');
c = c.replace(/case "menunggu_verifikasi_bendahara":/g, 'case "menunggu_verifikasi_pegawai":');
c = c.replace(/statusFilter === "menunggu_verifikasi_bendahara"/g, 'statusFilter === "menunggu_verifikasi_pegawai"');

// Form submission when approving: transition to bendahara
c = c.replace(/status: "menunggu_verifikasi_pptk" as const/g, 'status: "menunggu_verifikasi_bendahara" as const');
c = c.replace(/body: JSON.stringify\(\{ status: "menunggu_verifikasi_pptk" \}\)/g, 'body: JSON.stringify({ status: "menunggu_verifikasi_bendahara" })');
c = c.replace(/selectedLaporanToReview.status === "menunggu_verifikasi_bendahara"/g, 'selectedLaporanToReview.status === "menunggu_verifikasi_pegawai"');

fs.writeFileSync(file, c);
