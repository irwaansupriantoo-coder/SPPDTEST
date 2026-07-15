const fs = require('fs');

let file = 'a:/IRWAN/SPPD/src/app/pages/ArsipSPJPegawai.tsx';
let c = fs.readFileSync(file, 'utf-8');

c = c.replace(/ArsipSPJBendahara/g, 'ArsipSPJPegawai');
c = c.replace(/Dashboard Bendahara/g, 'Dashboard Pegawai');
c = c.replace(/Arsip SPJ Bendahara/g, 'Arsip SPJ Pegawai');

// Change the expected status for the list
// Actually for Arsip, it usually shows "selesai" or anything already processed.
// We should probably filter by nip for Pegawai.
c = c.replace(/d.status === "selesai"/g, 'd.status === "selesai" && d.pelaksana.some(p => p.nip === user.nip)');
c = c.replace(/d.status === "menunggu_verifikasi_kpa"/g, '(d.status === "menunggu_verifikasi_kpa" || d.status === "menunggu_verifikasi_bendahara" || d.status === "menunggu_verifikasi_pptk") && d.pelaksana.some(p => p.nip === user.nip)');

// Change bendahara specific statuses if they exist
c = c.replace(/menunggu_verifikasi_bendahara/g, 'menunggu_verifikasi_pegawai');

fs.writeFileSync(file, c);
