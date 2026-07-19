import { createClient } from '@supabase/supabase-js';


const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function loadData() {
  // Mock user
  const user = { role: 'pengelola', nip: '199106272023211019', nama: 'Wenry Adeputra' };

  // 1. getAllPengajuan
  const res = await fetch(`${SERVER_BASE}/pengajuan?limit=1000`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  let data = await res.json();
  data = data.data || [];

  console.log("getAllPengajuan returned:", data.length, "items");

  // 2. hiddenIds
  const hiddenIds = [];

  // Filter out hidden and completed
  const filteredData = data.filter((d) => d.noSppd?.includes('SPPD') && !hiddenIds.includes(d.noSppd));
  
  console.log("After SPPD filter:", filteredData.length, "items");

  // Mock batchGetLaporanStatus
  const laporanStatuses = {};
  const statusMap = {};
  const tanggalMap = {};

  const dataWithStatus = filteredData
    .filter((d) => {
      const spjStatus = laporanStatuses[d.noSppd] || d.status || "belum_spj";
      return spjStatus !== "selesai";
    })
    .map((d) => {
      const sppd = d.noSppd || d.no_sppd || '';
      return {
        ...d,
        noSppd: sppd,
        statusPengajuan: statusMap[sppd] || 'Menunggu Persetujuan',
        tanggalPersetujuan: tanggalMap[sppd] || ''
      };
    });

  console.log("After status filter:", dataWithStatus.length, "items");

  const validData = dataWithStatus.filter((d) => {
    if (user?.role === 'pengelola') {
      const nip = typeof d.pembuat === 'string' ? null : d.pembuat?.nip;
      const nama = typeof d.pembuat === 'string' ? d.pembuat : d.pembuat?.nama;
      if (nip && nip !== user?.nip && nama !== user?.nama) return false;
    }
    if (d.isDuplicated && d.statusPengajuan !== 'Disetujui') return false;

    return true;
  });

  console.log("After user filter (validData):", validData.length, "items");
  if (validData.length > 0) {
    console.log("Sample:", validData[0].noSppd);
  }
}

loadData();
