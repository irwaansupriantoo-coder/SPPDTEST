// Helper untuk menyimpan status persetujuan pengajuan (mock DB)

export const getStatusPengajuan = (id: string): string => {
  const statuses = JSON.parse(localStorage.getItem('sppd_statuses') || '{}');
  return statuses[id] || 'Menunggu Persetujuan'; // default
};

export const setStatusPengajuan = (id: string, status: string) => {
  const statuses = JSON.parse(localStorage.getItem('sppd_statuses') || '{}');
  statuses[id] = status;
  localStorage.setItem('sppd_statuses', JSON.stringify(statuses));
  
  if (status === 'Disetujui') {
    const dates = JSON.parse(localStorage.getItem('sppd_approval_dates') || '{}');
    dates[id] = new Date().toISOString();
    localStorage.setItem('sppd_approval_dates', JSON.stringify(dates));
  }
};

export const getTanggalPersetujuan = (id: string): string => {
  const dates = JSON.parse(localStorage.getItem('sppd_approval_dates') || '{}');
  return dates[id] || '';
};
export const getPegawaiApprovals = (noSppd: string): string[] => {
  const approvals = JSON.parse(localStorage.getItem('sppd_pegawai_approvals') || '{}');
  return approvals[noSppd] || [];
};

export const addPegawaiApproval = (noSppd: string, nip: string) => {
  const approvals = JSON.parse(localStorage.getItem('sppd_pegawai_approvals') || '{}');
  if (!approvals[noSppd]) {
    approvals[noSppd] = [];
  }
  if (!approvals[noSppd].includes(nip)) {
    approvals[noSppd].push(nip);
  }
  localStorage.setItem('sppd_pegawai_approvals', JSON.stringify(approvals));
};
