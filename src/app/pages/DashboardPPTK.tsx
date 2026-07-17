import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { KPICard } from '../components/KPICard';
import { ProfileCard } from '../components/ProfileCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { Wallet, TrendingUp, Edit, CheckCircle, MapPin, FileText, Clock, Eye, XCircle, Search, Filter, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/supabaseClient';
import { batchGetStatusPengajuan, batchGetTanggalPersetujuan } from '../utils/statusStore';
import { batchGetLaporanStatus, batchGetPelaksanaData, batchGetProgramData, getHiddenSppdIds, getProgramData, getPelaksanaData } from '../utils/supabaseDataStore';
import { SppdPreviewModal } from '../components/SppdPreviewModal';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  getSubKegiatanByPPTK, 
  SubKegiatan, 
  updatePagu, 
  assignPengelola 
} from '../utils/anggaranStore';
import { Toaster, toast } from 'sonner';

const AVAILABLE_PENGELOLA = [
  { nip: "199706102025211001", nama: "Deny Cahyadi" },
  { nip: "199904282025212020", nama: "Annisa Apriani" },
  { nip: "199201242023211018", nama: "Rijal Rasyidin" }
];

export default function DashboardPPTK() {
  const [data, setData] = useState<SubKegiatan[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{paguDalamDaerah?: number, paguLuarDaerah?: number, pengelolaNips?: string[]}>({});

  const [latestPengajuan, setLatestPengajuan] = useState<any[]>([]);
  const [latestLaporan, setLatestLaporan] = useState<any[]>([]);
  const [latestArsip, setLatestArsip] = useState<any[]>([]);
  const [isSppdModalOpen, setIsSppdModalOpen] = useState(false);
  const [selectedSppd, setSelectedSppd] = useState<any>(null);
  const [statusMapState, setStatusMapState] = useState<Record<string, string>>({});
  const [tanggalMapState, setTanggalMapState] = useState<Record<string, string>>({});

  const [searchSubKegiatan, setSearchSubKegiatan] = useState('');
  const [filterSubKegiatan, setFilterSubKegiatan] = useState('Semua');
  const [pageSubKegiatan, setPageSubKegiatan] = useState(1);

  const [searchPengajuan, setSearchPengajuan] = useState('');
  const [filterPengajuan, setFilterPengajuan] = useState('Semua');
  const [pagePengajuan, setPagePengajuan] = useState(1);

  const [searchLaporan, setSearchLaporan] = useState('');
  const [filterLaporan, setFilterLaporan] = useState('Semua');
  const [pageLaporan, setPageLaporan] = useState(1);

  const [searchArsip, setSearchArsip] = useState('');
  const [filterArsip, setFilterArsip] = useState('Semua');
  const [pageArsip, setPageArsip] = useState(1);

  const itemsPerPage = 5;

  const { user } = useAuth();
  const navigate = useNavigate();
  const pptkNip = user?.nip || "199511302022032030";

  useEffect(() => {
    fetchPengajuan();
  }, [pptkNip]);

  const fetchPengajuan = async () => {
    try {
      const res = await apiRequest<{ data: any[] }>('/pengajuan');
      const pengajuanData = res.data || [];

      // Pre-fetch all Supabase data in batch
      const allSppdIds = pengajuanData.map((d: any) => d.noSppd || d.no_sppd || '').filter(Boolean);
      const [sMap, laporanStatusMap, hiddenIds, pelaksanaMap, programDataMap] = await Promise.all([
        batchGetStatusPengajuan(allSppdIds),
        batchGetLaporanStatus(allSppdIds),
        getHiddenSppdIds(),
        batchGetPelaksanaData(allSppdIds),
        batchGetProgramData(allSppdIds),
      ]);
      setStatusMapState(sMap);

      const msk = getSubKegiatanByPPTK(pptkNip);
      const mskNames = msk.map(sk => sk.nama);

      let subKegiatanRealisasi: Record<string, { dalam: number, luar: number }> = {};
      mskNames.forEach(name => {
        subKegiatanRealisasi[name] = { dalam: 0, luar: 0 };
      });

      pengajuanData.forEach(row => {
        const sppd = row.noSppd || row.no_sppd || '';
        const status = sMap[sppd] || "belum_spj";
        const spjStatus = laporanStatusMap[sppd] || row.status || "belum_spj";

        const parsedProgram = programDataMap[sppd] || {};
        const subKegiatanName = parsedProgram.subKegiatan || row.subKegiatan;

        const isHiddenOrInvalid = hiddenIds.includes(sppd) || !sppd.includes('SPPD') || (row.isDuplicated && status !== 'Disetujui');

        if (isHiddenOrInvalid) return;

        if (spjStatus === 'selesai') {
          let actualTotalAnggaran = row.totalAnggaran || 0;
          try {
            const storedPelaksana = pelaksanaMap[sppd];
            if (storedPelaksana && storedPelaksana.length > 0) {
              const hydratedPelaksana = storedPelaksana;
              actualTotalAnggaran = hydratedPelaksana.reduce((sum: number, p: any) => sum + (p.totalBiayaHotel || 0) + (p.totalSewaKendaraan || 0) + (p.totalUangHarian || 0) + (p.totalPesawat || 0) + (p.totalKeretaApi || 0) + (p.totalBiayaTol || 0), 0);
            }
          } catch(e) {}

          if (row.tipePerjalanan === 'Dalam Daerah') {
            if (subKegiatanName && subKegiatanRealisasi[subKegiatanName]) {
              subKegiatanRealisasi[subKegiatanName].dalam += actualTotalAnggaran;
            }
          }
          else if (row.tipePerjalanan === 'Luar Daerah') {
            if (subKegiatanName && subKegiatanRealisasi[subKegiatanName]) {
              subKegiatanRealisasi[subKegiatanName].luar += actualTotalAnggaran;
            }
          }
        }
      });

      const updatedMsk = msk.map(sk => ({
        ...sk,
        realisasiDalamDaerah: subKegiatanRealisasi[sk.nama]?.dalam || 0,
        realisasiLuarDaerah: subKegiatanRealisasi[sk.nama]?.luar || 0
      }));
      setData(updatedMsk);

      const validData = pengajuanData.filter(d => {
        const sppdStr = d.noSppd || d.no_sppd || '';
        const parsedProgram = programDataMap[sppdStr] || {};
        const dSub = parsedProgram.subKegiatan || d.subKegiatan;
        
        const isManaged = mskNames.includes(dSub);
        
        const nip = typeof d.pembuat === 'string' ? null : d.pembuat?.nip;
        const nama = typeof d.pembuat === 'string' ? d.pembuat : d.pembuat?.nama;
        const isOwn = (nip && nip === pptkNip) || (nama && nama === user?.nama);
        
        let isPelaksana = false;
        try {
          const storedPelaksana = pelaksanaMap[sppdStr];
          const pelaksanaList = (storedPelaksana && storedPelaksana.length > 0) ? storedPelaksana : d.pelaksana || [d.pembuat];
          if (Array.isArray(pelaksanaList)) {
            isPelaksana = pelaksanaList.some((p: any) => p.nip === pptkNip || p.nama === user?.nama);
          }
        } catch(e) {}
        
        return isManaged || isOwn || isPelaksana;
      });

      const filteredPengajuan = validData.filter(d => {
        const sppd = d.noSppd || d.no_sppd || '';
        if (hiddenIds.includes(sppd)) return false;
        if (!sppd.includes('SPPD')) return false;

        const status = sMap[sppd] || "belum_spj";
        if (d.isDuplicated && status !== 'Disetujui') return false;

        const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";
        if (spjStatus === 'selesai') return false;

        return true;
      });

      const sortedSppd = filteredPengajuan.sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
      setLatestPengajuan(sortedSppd);

      const laporanList = validData.filter(d => {
        const sppd = d.noSppd || d.no_sppd || '';
        const status = sMap[sppd] || "belum_spj";
        const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";

        if (hiddenIds.includes(sppd)) return false;
        if (!sppd.includes('SPPD')) return false;
        
        if (d.isDuplicated && status !== 'Disetujui') return false;
        if (spjStatus === 'selesai') return false;

        const isApproved = status === "Disetujui" || (status === "Menunggu Persetujuan" && !d.id);
        return isApproved || spjStatus !== 'belum_spj';
      }).sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
      setLatestLaporan(laporanList);

      const hydrateTotalAnggaran = (d: any) => {
        let hydratedTotalAnggaran = d.totalAnggaran;
        try {
          const storedPelaksana = pelaksanaMap[d.noSppd || d.no_sppd];
          if (storedPelaksana && storedPelaksana.length > 0) {
            const hydratedPelaksana = storedPelaksana;
            hydratedTotalAnggaran = hydratedPelaksana.reduce((sum: number, p: any) => sum + (p.totalBiayaHotel || 0) + (p.totalSewaKendaraan || 0) + (p.totalUangHarian || 0) + (p.totalPesawat || 0) + (p.totalKeretaApi || 0) + (p.totalBiayaTol || 0), 0);
          }
        } catch(e) {}
        return { ...d, totalAnggaran: hydratedTotalAnggaran };
      };

      const arsipList = validData.filter(d => {
        const sppd = d.noSppd || d.no_sppd || '';
        const status = sMap[sppd] || "belum_spj";
        const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";

        if (hiddenIds.includes(sppd)) return false;
        if (!sppd.includes('SPPD')) return false;
        
        if (d.isDuplicated && status !== 'Disetujui') return false;
        
        return spjStatus === 'selesai';
      }).map(hydrateTotalAnggaran).sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
      setLatestArsip(arsipList);

    } catch (err) {
      console.error("Error fetching pengajuan in PPTK:", err);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Disetujui": return <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1 w-max mx-auto"><CheckCircle className="w-3 h-3" /> Disetujui</span>;
      case "Ditolak": return <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-1 w-max mx-auto"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default: return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1 w-max mx-auto"><Clock className="w-3 h-3" /> Menunggu Persetujuan</span>;
    }
  };

  const getSpjStatusBadge = (spjStatus: string) => {
    switch (spjStatus) {
      case "selesai": return <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 w-max mx-auto block text-center">Selesai</span>;
      case "belum_spj":
      case "draft_laporan":
      case "Menunggu Persetujuan":
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 w-max mx-auto block text-center">{spjStatus === "draft_laporan" ? "Draft Laporan" : "Belum SPJ"}</span>;
      case "menunggu_verifikasi_pegawai": return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 w-max mx-auto block text-center">Menunggu Pegawai</span>;
      case "menunggu_verifikasi_bendahara": return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 w-max mx-auto block text-center">Menunggu Bendahara</span>;
      case "menunggu_verifikasi_pptk": return <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 w-max mx-auto block text-center">Menunggu PPTK</span>;
      case "menunggu_verifikasi_kpa": return <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200 w-max mx-auto block text-center">Menunggu KPA</span>;
      case "menunggu_pembayaran": return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 w-max mx-auto block text-center">Menunggu Pembayaran</span>;
      case "perbaikan": return <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 w-max mx-auto block text-center">Perbaikan</span>;
      default:
        if (spjStatus?.startsWith("menunggu_verifikasi")) return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 w-max mx-auto block text-center">Menunggu Verifikasi</span>;
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 w-max mx-auto block text-center">Belum SPJ</span>;
    }
  };

  const loadData = () => {
    fetchPengajuan();
  };

  const totalPaguDalamDaerah = data.reduce((acc, curr) => acc + curr.paguDalamDaerah, 0);
  const totalRealisasiDalamDaerah = data.reduce((acc, curr) => acc + curr.realisasiDalamDaerah, 0);
  
  const totalPaguLuarDaerah = data.reduce((acc, curr) => acc + curr.paguLuarDaerah, 0);
  const totalRealisasiLuarDaerah = data.reduce((acc, curr) => acc + curr.realisasiLuarDaerah, 0);

  const kpiData = [
    {
      icon: Wallet,
      value: `Rp ${totalPaguDalamDaerah.toLocaleString('id-ID')}`,
      label: 'Total Pagu (Dalam Daerah)',
      bgColor: 'bg-[#c0e8ff]',
      iconColor: 'text-[#00475e]',
      hoverColor: 'group-hover:text-[#00475e]'
    },
    {
      icon: TrendingUp,
      value: `Rp ${totalRealisasiDalamDaerah.toLocaleString('id-ID')}`,
      label: 'Realisasi (Dalam Daerah)',
      bgColor: 'bg-[#ffddbb]',
      iconColor: 'text-[#5f3800]',
      hoverColor: 'group-hover:text-[#5f3800]'
    },
    {
      icon: Wallet,
      value: `Rp ${totalPaguLuarDaerah.toLocaleString('id-ID')}`,
      label: 'Total Pagu (Luar Daerah)',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      hoverColor: 'group-hover:text-green-600'
    },
    {
      icon: TrendingUp,
      value: `Rp ${totalRealisasiLuarDaerah.toLocaleString('id-ID')}`,
      label: 'Realisasi (Luar Daerah)',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      hoverColor: 'group-hover:text-purple-600'
    }
  ];

  const handleSaveEdit = () => {
    if (isEditing) {
      if (editForm.pengelolaNips !== undefined) {
        assignPengelola(isEditing, editForm.pengelolaNips);
      }
      toast.success("Perubahan data berhasil disimpan");
      setIsEditing(null);
      loadData();
    }
  };

  const togglePengelola = (nip: string) => {
    const currentNips = editForm.pengelolaNips || [];
    if (currentNips.includes(nip)) {
      setEditForm({ ...editForm, pengelolaNips: currentNips.filter(n => n !== nip) });
    } else {
      setEditForm({ ...editForm, pengelolaNips: [...currentNips, nip] });
    }
  };

  const filterData = (dataList: any[], search: string, filter: string) => {
    return dataList.filter(item => {
      const matchSearch = (item.noSppd || item.no_sppd || '').toLowerCase().includes(search.toLowerCase()) || 
                          (item.kota || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'Semua' || item.tipePerjalanan === filter;
      return matchSearch && matchFilter;
    });
  };

  const filteredSubKegiatanData = data.filter(sk => {
    const matchSearch = sk.nama.toLowerCase().includes(searchSubKegiatan.toLowerCase());
    let matchFilter = true;
    if (filterSubKegiatan === 'Dalam Daerah') {
      matchFilter = sk.paguDalamDaerah > 0 || sk.realisasiDalamDaerah > 0;
    } else if (filterSubKegiatan === 'Luar Daerah') {
      matchFilter = sk.paguLuarDaerah > 0 || sk.realisasiLuarDaerah > 0;
    }
    return matchSearch && matchFilter;
  });
  const paginatedSubKegiatan = filteredSubKegiatanData.slice((pageSubKegiatan - 1) * itemsPerPage, pageSubKegiatan * itemsPerPage);

  const filteredPengajuanData = filterData(latestPengajuan, searchPengajuan, filterPengajuan);
  const paginatedPengajuan = filteredPengajuanData.slice((pagePengajuan - 1) * itemsPerPage, pagePengajuan * itemsPerPage);

  const filteredLaporanData = filterData(latestLaporan, searchLaporan, filterLaporan);
  const paginatedLaporan = filteredLaporanData.slice((pageLaporan - 1) * itemsPerPage, pageLaporan * itemsPerPage);

  const filteredArsipData = filterData(latestArsip, searchArsip, filterArsip);
  const paginatedArsip = filteredArsipData.slice((pageArsip - 1) * itemsPerPage, pageArsip * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />

      <main className="ml-64 pt-20 p-8 min-h-screen">
        <header className="mb-10">
          <p className="text-[#4c616d] font-semibold uppercase tracking-[0.15em] text-[10px] mb-2">Selamat Datang</p>
          <h2 className="text-4xl font-bold tracking-tight text-[#00475e] mb-1">Dashboard PPTK</h2>
          <p className="text-[#40484d] max-w-2xl">
            Pantau anggaran Sub Kegiatan Anda dan kelola pengelola kegiatan.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00475e]"></span>Pagu & Realisasi Sub Kegiatan</h3>
              <p className="text-xs text-slate-500 mt-1">Daftar Sub Kegiatan yang dipegang oleh Anda dan Pengelola terkait</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Sub Kegiatan..."
                  value={searchSubKegiatan}
                  onChange={(e) => {
                    setSearchSubKegiatan(e.target.value);
                    setPageSubKegiatan(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e]"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filterSubKegiatan}
                  onChange={(e) => {
                    setFilterSubKegiatan(e.target.value);
                    setPageSubKegiatan(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e] appearance-none bg-white"
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="Dalam Daerah">Dalam Daerah</option>
                  <option value="Luar Daerah">Luar Daerah</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f6]">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub Kegiatan</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pagu (Dalam)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (Dalam)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (%) Dalam</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pagu (Luar)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (Luar)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (%) Luar</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pengelola</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedSubKegiatan.map((item) => {
                  const percentDalam = item.paguDalamDaerah > 0 ? ((item.realisasiDalamDaerah / item.paguDalamDaerah) * 100).toFixed(1) : "0.0";
                  const percentLuar = item.paguLuarDaerah > 0 ? ((item.realisasiLuarDaerah / item.paguLuarDaerah) * 100).toFixed(1) : "0.0";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#00475e] text-xs leading-tight max-w-xs">{item.nama}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        {`Rp ${item.paguDalamDaerah.toLocaleString('id-ID')}`}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        Rp {item.realisasiDalamDaerah.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        {percentDalam}%
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        {`Rp ${item.paguLuarDaerah.toLocaleString('id-ID')}`}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        Rp {item.realisasiLuarDaerah.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                        {percentLuar}%
                      </td>
                      <td className="px-4 py-4">
                        {isEditing === item.id ? (
                          <div className="space-y-2">
                            {AVAILABLE_PENGELOLA.map(p => (
                              <label key={p.nip} className="flex items-center gap-2 text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={(editForm.pengelolaNips || []).includes(p.nip)}
                                  onChange={() => togglePengelola(p.nip)}
                                  className="rounded text-[#00475e]"
                                />
                                {p.nama}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs space-y-1">
                            {item.pengelolaNips.length > 0 ? item.pengelolaNips.map(nip => {
                              const p = AVAILABLE_PENGELOLA.find(x => x.nip === nip);
                              return <div key={nip} className="px-2 py-1 bg-slate-100 rounded">{p ? p.nama : nip}</div>;
                            }) : <span className="text-slate-400 italic">Belum ada pengelola</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center align-top">
                        {isEditing === item.id ? (
                          <div className="flex flex-col gap-2 justify-center">
                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-[#00475e] text-white rounded text-xs font-bold hover:bg-[#1a5f7a]">Simpan</button>
                            <button onClick={() => setIsEditing(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300">Batal</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setIsEditing(item.id);
                              setEditForm({ 
                                pengelolaNips: item.pengelolaNips 
                              });
                            }} 
                            className="px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                      Anda belum diberikan tugas Sub Kegiatan oleh Bendahara.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Menampilkan {filteredSubKegiatanData.length === 0 ? 0 : (pageSubKegiatan - 1) * itemsPerPage + 1}-{Math.min(pageSubKegiatan * itemsPerPage, filteredSubKegiatanData.length)} dari {filteredSubKegiatanData.length} data
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageSubKegiatan(p => Math.max(1, p - 1))}
                  disabled={pageSubKegiatan === 1}
                  className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageSubKegiatan(p => Math.min(Math.ceil(filteredSubKegiatanData.length / itemsPerPage), p + 1))}
                  disabled={pageSubKegiatan >= Math.ceil(filteredSubKegiatanData.length / itemsPerPage) || filteredSubKegiatanData.length === 0}
                  className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

            {/* SPPD Monitoring Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
                  Pemantauan Pengajuan SPPD Terbaru
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SPPD</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kota Tujuan</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Anggaran</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Perjalanan</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedPengajuan.length > 0 ? paginatedPengajuan.map((item, idx) => {
                      const sppd = item.noSppd || item.no_sppd || '';
                      const statusPeng = statusMapState[sppd] || "belum_spj";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4"><p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p></td>
                          <td className="px-4 py-4"><div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><MapPin className="w-3.5 h-3.5 text-[#00475e]" />{item.kota}</div></td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4"><p className="font-medium text-slate-600 text-xs">{item.tipePerjalanan}</p></td>
                          <td className="px-4 py-4 text-center">{getStatusBadge(statusPeng)}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={async () => {
                                const sppdStr = item.noSppd || item.no_sppd || '';
                                const programData = await getProgramData(sppdStr);
                                const pelaksanaList = await getPelaksanaData(sppdStr) || item.pelaksana || [item.pembuat];
                                setSelectedSppd({ ...item, ...programData.program, ...programData.dates, pelaksana: pelaksanaList, statusPengajuan: statusPeng, tanggalPersetujuan: tanggalMapState[sppdStr] || "" });
                                setIsSppdModalOpen(true);
                              }}
                              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded font-medium hover:bg-slate-200 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm font-medium">Belum ada data pengajuan</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Menampilkan {filteredPengajuanData.length === 0 ? 0 : (pagePengajuan - 1) * itemsPerPage + 1}-{Math.min(pagePengajuan * itemsPerPage, filteredPengajuanData.length)} dari {filteredPengajuanData.length} data
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagePengajuan(p => Math.max(1, p - 1))}
                    disabled={pagePengajuan === 1}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagePengajuan(p => Math.min(Math.ceil(filteredPengajuanData.length / itemsPerPage), p + 1))}
                    disabled={pagePengajuan >= Math.ceil(filteredPengajuanData.length / itemsPerPage) || filteredPengajuanData.length === 0}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SPJ Laporan Table without Action */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm mt-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
                  Pemantauan Laporan (SPJ) Perjalanan Dinas
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari No. SPPD atau Tujuan..."
                      value={searchLaporan}
                      onChange={(e) => {
                        setSearchLaporan(e.target.value);
                        setPageLaporan(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e]"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={filterLaporan}
                      onChange={(e) => {
                        setFilterLaporan(e.target.value);
                        setPageLaporan(1);
                      }}
                      className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e] appearance-none bg-white"
                    >
                      <option value="Semua">Semua Tipe</option>
                      <option value="Dalam Daerah">Dalam Daerah</option>
                      <option value="Luar Daerah">Luar Daerah</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SPPD</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daerah Tujuan</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Anggaran</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedLaporan.length > 0 ? paginatedLaporan.map((item, idx) => {
                      const sppd = item.noSppd || item.no_sppd || '';
                      const spjStatus = laporanStatusMap[sppd] || item.status || "belum_spj";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4"><p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p></td>
                          <td className="px-4 py-4"><div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><MapPin className="w-3.5 h-3.5 text-[#00475e]" />{item.kota}</div></td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4 text-center">{getSpjStatusBadge(spjStatus)}</td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm font-medium">Belum ada data</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Menampilkan {filteredLaporanData.length === 0 ? 0 : (pageLaporan - 1) * itemsPerPage + 1}-{Math.min(pageLaporan * itemsPerPage, filteredLaporanData.length)} dari {filteredLaporanData.length} data
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageLaporan(p => Math.max(1, p - 1))}
                    disabled={pageLaporan === 1}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPageLaporan(p => Math.min(Math.ceil(filteredLaporanData.length / itemsPerPage), p + 1))}
                    disabled={pageLaporan >= Math.ceil(filteredLaporanData.length / itemsPerPage) || filteredLaporanData.length === 0}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => window.location.href = '/pptk/persetujuan-spj'}
                  className="text-xs font-semibold text-[#00475e] hover:text-[#003344] flex items-center gap-1 bg-[#e6f3f8] px-4 py-2 rounded-lg transition-colors"
                >
                  Lihat Semua Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Arsip Laporan (SPJ) Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm mt-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
                  Arsip Laporan (SPJ) Terbaru
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari No. SPPD atau Tujuan..."
                      value={searchArsip}
                      onChange={(e) => {
                        setSearchArsip(e.target.value);
                        setPageArsip(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e]"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={filterArsip}
                      onChange={(e) => {
                        setFilterArsip(e.target.value);
                        setPageArsip(1);
                      }}
                      className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e] appearance-none bg-white"
                    >
                      <option value="Semua">Semua Tipe</option>
                      <option value="Dalam Daerah">Dalam Daerah</option>
                      <option value="Luar Daerah">Luar Daerah</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SPPD</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daerah Tujuan</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Anggaran</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedArsip.length > 0 ? paginatedArsip.map((item, idx) => {
                      const sppd = item.noSppd || item.no_sppd || '';
                      const spjStatus = laporanStatusMap[sppd] || item.status || "belum_spj";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4"><p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p></td>
                          <td className="px-4 py-4"><div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><MapPin className="w-3.5 h-3.5 text-[#00475e]" />{item.kota}</div></td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4 text-center">{getSpjStatusBadge(spjStatus)}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => {
                                navigate('/pptk/arsip-spj', { state: { redirectSppd: sppd } });
                              }}
                              className="text-xs bg-slate-100 text-[#00475e] px-3 py-1.5 rounded font-medium hover:bg-slate-200 inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Detail
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm font-medium">Belum ada data</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Menampilkan {filteredArsipData.length === 0 ? 0 : (pageArsip - 1) * itemsPerPage + 1}-{Math.min(pageArsip * itemsPerPage, filteredArsipData.length)} dari {filteredArsipData.length} data
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageArsip(p => Math.max(1, p - 1))}
                    disabled={pageArsip === 1}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPageArsip(p => Math.min(Math.ceil(filteredArsipData.length / itemsPerPage), p + 1))}
                    disabled={pageArsip >= Math.ceil(filteredArsipData.length / itemsPerPage) || filteredArsipData.length === 0}
                    className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => window.location.href = '/pptk/arsip-spj'}
                  className="text-xs font-semibold text-[#00475e] hover:text-[#003344] flex items-center gap-1 bg-[#e6f3f8] px-4 py-2 rounded-lg transition-colors"
                >
                  Lihat Semua Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 space-y-8">
            <ProfileCard />
            <ActivityFeed />
          </div>
        </div>
      </main>

      {selectedSppd && (
        <SppdPreviewModal
          isOpen={isSppdModalOpen}
          onClose={() => setIsSppdModalOpen(false)}
          data={selectedSppd}
        />
      )}
    </div>
  );
}
