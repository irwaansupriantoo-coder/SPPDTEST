const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

async function test() {
  const payload = {
    noSpt: "TEST-01",
    noSppd: "TEST-SPPD-01",
    pembuat: {
      nama: "Test User",
      nip: "12345"
    },
    pelaksana: [
      { nama: "Test", nip: "123", pangkat: "III/a", jabatan: "Staf", statusLaporan: "belum_lengkap" }
    ],
    kota: "Samarinda",
    totalAnggaran: 1000000,
    tipePerjalanan: "Dalam Daerah",
    tempatBerangkat: "Berau",
    tanggalPergi: "2026-07-17",
    tanggalKembali: "2026-07-19",
    keperluan: "Test",
    alatAngkut: "Darat",
  };

  const res = await fetch(`${SERVER_BASE}/pengajuan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

test();
