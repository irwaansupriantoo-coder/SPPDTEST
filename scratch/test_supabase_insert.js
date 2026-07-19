import { createClient } from '@supabase/supabase-js';

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function test() {
  const payload = {
    no_spt: "TEST-01",
    no_sppd: "TEST-SPPD-01",
    pembuat: {
      nama: "Test User",
      nip: "12345"
    },
    pelaksana: [
      { nama: "Test", nip: "123", pangkat: "III/a", jabatan: "Staf", statusLaporan: "belum_lengkap" }
    ],
    kota: "Samarinda",
    total_anggaran: 1000000,
    tipe_perjalanan: "Dalam Daerah",
    tempat_berangkat: "Berau",
    tanggal_pergi: "2026-07-17",
    tanggal_kembali: "2026-07-19",
    keperluan: "Test",
    alat_angkut: "Darat",
  };

  const { data, error } = await supabase
    .from('pengajuan_sppd')
    .insert(payload);
    
  console.log("Error:", error);
  console.log("Data:", data);
}

test();
