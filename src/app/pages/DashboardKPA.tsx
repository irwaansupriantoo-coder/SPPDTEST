import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { KPICard } from '../components/KPICard';
import { BudgetSection } from '../components/BudgetSection';
import { GuideSection } from '../components/GuideSection';
import { ProfileCard } from '../components/ProfileCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { BudgetDialog, BudgetData } from '../components/BudgetDialog';
import { Eye, CheckCircle, XCircle, Timer, Database, MapPin, FileText, Clock, Users, Search, Filter, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/supabaseClient';
import { toast, Toaster } from 'sonner';
import { getStatusPengajuan, getTanggalPersetujuan, batchGetStatusPengajuan } from '../utils/statusStore';
import {  batchGetLaporanStatus, batchGetPelaksanaData, batchGetProgramData, getHiddenSppdIds, getProgramData, getPelaksanaData , getAllPengajuan } from "../utils/supabaseDataStore";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { SubKegiatan, getSubKegiatanData, syncSubKegiatanData } from '../utils/anggaranStore';
import { SppdPreviewModal } from '../components/SppdPreviewModal';
import { AVAILABLE_PEGAWAI } from '../utils/pegawai';

interface StatsData {
  total: number;
  disetujui: number;
  ditolak: number;
  menunggu: number;
  belumSpj: number;
}

interface AnggaranData {
  dalamDaerah: { total: number; used: number };
  luarDaerah: { total: number; used: number };
}

interface LaporanData {
  id: string;
  noSpt: string;
  noSppd?: string;
  no_sppd?: string;
  pembuat: any;
  kota: string;
  tipePerjalanan: string;
  totalAnggaran: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  isDuplicated?: boolean;
  subKegiatan?: string;
  pelaksana?: any[];
}

const DetailPengurusModal = ({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: SubKegiatan | null }) => {
  if (!isOpen || !data) return null;
  const pptkName = AVAILABLE_PEGAWAI.find(p => p.nip === data.pptkNip)?.nama || data.pptkNip || 'Belum diatur';
  const pengelolaList = data.pengelolaNips?.map(nip => AVAILABLE_PEGAWAI.find(p => p.nip === nip)?.nama || nip) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full">
          <XCircle className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-lg mb-4 text-[#00475e] flex items-center gap-2">
          <Users className="w-5 h-5" /> Detail Pengurus
        </h3>
        <div className="space-y-4">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-[10px] uppercase font-bold text-blue-600 mb-1">Pejabat Pelaksana Teknis Kegiatan (PPTK)</h4>
            <p className="font-medium text-[#00475e] text-sm">{pptkName}</p>
            {data.pptkNip && <p className="text-xs text-slate-500 mt-0.5">NIP: {data.pptkNip}</p>}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Pengelola Data SPPD</h4>
            {pengelolaList.length > 0 ? (
              <ul className="space-y-2">
                {pengelolaList.map((nama, idx) => (
                  <li key={idx} className="text-sm font-medium text-[#191c1e] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00475e]"></div>
                    {nama}
                    <span className="text-xs text-slate-500 block ml-3.5">NIP: {data.pengelolaNips[idx]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">Belum ada pengelola data yang ditugaskan</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-[#00475e] hover:bg-[#00384a] text-white rounded-xl font-bold text-sm transition-colors w-full">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardKPA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add'>('add');
  const [selectedBudgetType, setSelectedBudgetType] = useState<'Dalam Daerah' | 'Luar Daerah'>('Dalam Daerah');

  const [dalamDaerah, setDalamDaerah] = useState({ total: 600000000, used: 0 });
  const [luarDaerah, setLuarDaerah] = useState({ total: 2000000000, used: 0 });
  const [stats, setStats] = useState<StatsData>({ total: 0, disetujui: 0, ditolak: 0, menunggu: 0, belumSpj: 0 });
  const [latestPengajuan, setLatestPengajuan] = useState<LaporanData[]>([]);
  const [pengajuanStatuses, setPengajuanStatuses] = useState<Record<string, string>>({});
  const [laporanStatusMapState, setLaporanStatusMapState] = useState<Record<string, string>>({});
  const [latestLaporan, setLatestLaporan] = useState<LaporanData[]>([]);
  const [latestArsip, setLatestArsip] = useState<LaporanData[]>([]);
  const [allSubKegiatan, setAllSubKegiatan] = useState<SubKegiatan[]>([]);

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
  const [dbReady, setDbReady] = useState<'checking' | 'ready' | 'needs_migration'>('checking');
  
  const [isSppdModalOpen, setIsSppdModalOpen] = useState(false);
  const [selectedSppd, setSelectedSppd] = useState<any>(null);
  
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false);
  const [selectedSkData, setSelectedSkData] = useState<SubKegiatan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      await syncSubKegiatanData();
      try {
        let pengajuanData: LaporanData[] = [];
        let anggaranRes: AnggaranData | null = null;
        
        try {
          const data = await getAllPengajuan();
          const res = { data };
          pengajuanData = res.data || [];
        } catch (err) {
          console.error("Error fetching pengajuan:", err);
        }

        try {
          anggaranRes = await apiRequest<AnggaranData>('/anggaran');
        } catch (err) {
          console.error("Error fetching anggaran:", err);
        }

        let masuk = 0, disetujui = 0, ditolak = 0, menunggu = 0;
        let usedDalam = 0, usedLuar = 0;

        // KPA sees all SubKegiatan
        let msk: SubKegiatan[] = getSubKegiatanData();

        // KPA sees all pengajuan
        const validData = pengajuanData;

        const sppdList = validData.map((d: any) => d.noSppd || d.no_sppd || '').filter(Boolean);
        const [statusMap, laporanStatusMap, hiddenIds, pelaksanaMap, programDataMap] = await Promise.all([
          batchGetStatusPengajuan(sppdList),
          batchGetLaporanStatus(sppdList),
          getHiddenSppdIds(),
          batchGetPelaksanaData(sppdList),
          batchGetProgramData(sppdList),
        ]);
        setPengajuanStatuses(statusMap);
        setLaporanStatusMapState(laporanStatusMap);

        const subKegiatanRealisasi: Record<string, { dalam: number, luar: number }> = {};
        msk.forEach(sk => {
            subKegiatanRealisasi[sk.nama] = { dalam: 0, luar: 0 };
        });

        validData.forEach(row => {
           const sppd = row.noSppd || row.no_sppd || '';
           const status = statusMap[sppd] || 'Menunggu Persetujuan';
           const spjStatus = laporanStatusMap[sppd] || row.status || "belum_spj";

           const parsedProgram = programDataMap[sppd] || {};
           const subKegiatanName = parsedProgram.subKegiatan || row.subKegiatan;

           const isHiddenOrInvalid = hiddenIds.includes(sppd) || !sppd.includes('SPPD') || (row.isDuplicated && status !== 'Disetujui');

           if (isHiddenOrInvalid) {
               return;
           }

           // Calculate Widgets specifically for KPA: Pengajuan Masuk, Menunggu, Disetujui
           if (spjStatus !== 'selesai') {
             masuk++;
             if (status === 'Disetujui') disetujui++;
             else if (status === 'Ditolak') ditolak++;
             else if (status === 'Menunggu Persetujuan') menunggu++;
           }
           
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
               usedDalam += actualTotalAnggaran;
               if (subKegiatanName && subKegiatanRealisasi[subKegiatanName]) {
                 subKegiatanRealisasi[subKegiatanName].dalam += actualTotalAnggaran;
               }
             }
             else if (row.tipePerjalanan === 'Luar Daerah') {
               usedLuar += actualTotalAnggaran;
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

        setAllSubKegiatan(updatedMsk);

        // Map masuk to total for stats
        setStats({ total: masuk, disetujui, ditolak, menunggu, belumSpj: 0 });
        
        let targetDalam = updatedMsk.reduce((acc, sk) => acc + (sk.paguDalamDaerah || 0), 0);
        let targetLuar = updatedMsk.reduce((acc, sk) => acc + (sk.paguLuarDaerah || 0), 0);
        let totalUsedDalam = updatedMsk.reduce((acc, sk) => acc + (sk.realisasiDalamDaerah || 0), 0);
        let totalUsedLuar = updatedMsk.reduce((acc, sk) => acc + (sk.realisasiLuarDaerah || 0), 0);

        setDalamDaerah({ total: targetDalam, used: totalUsedDalam });
        setLuarDaerah({ total: targetLuar, used: totalUsedLuar });

        const filteredPengajuan = validData.filter(d => {
           const sppd = d.noSppd || d.no_sppd || '';
           if (hiddenIds.includes(sppd)) return false;
           if (!sppd.includes('SPPD')) return false;

           const status = statusMap[sppd] || 'Menunggu Persetujuan';
           if (d.isDuplicated && status !== 'Disetujui') return false;

           const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";
           if (spjStatus === 'selesai') return false;

           return true;
        });

        const sortedSppd = filteredPengajuan.sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
        setLatestPengajuan(sortedSppd);

        const laporanList = validData.filter(d => {
           const sppd = d.noSppd || d.no_sppd || '';
           const status = statusMap[sppd] || 'Menunggu Persetujuan';
           const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";

           if (hiddenIds.includes(sppd)) return false;
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
           const status = statusMap[sppd] || 'Menunggu Persetujuan';
           const spjStatus = laporanStatusMap[sppd] || d.status || "belum_spj";

           if (hiddenIds.includes(sppd)) return false;
           if (hiddenIds.includes(sppd)) return false;
           if (!sppd.includes('SPPD')) return false;
           
           if (d.isDuplicated && status !== 'Disetujui') return false;
           
           return spjStatus === 'selesai';
        }).map(hydrateTotalAnggaran).sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
        setLatestArsip(arsipList);

        setDbReady('ready');
      } catch (err: any) {
        console.log('Dashboard data fetch error:', err);
        setDbReady('ready');
      }
    };
    fetchData();
  }, []);


  const kpiData = [
    {
      icon: Eye,
      value: String(stats.total).padStart(2, '0'),
      label: 'Pengajuan Masuk',
      bgColor: 'bg-[#c0e8ff]',
      iconColor: 'text-[#00475e]',
      hoverColor: 'group-hover:text-[#00475e]'
    },
    {
      icon: Timer,
      value: String(stats.menunggu).padStart(2, '0'),
      label: 'Menunggu Persetujuan',
      bgColor: 'bg-[#ffddbb]',
      iconColor: 'text-[#5f3800]',
      hoverColor: 'group-hover:text-[#5f3800]'
    },
    {
      icon: CheckCircle,
      value: String(stats.disetujui).padStart(2, '0'),
      label: 'Disetujui',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      hoverColor: 'group-hover:text-green-600'
    }
  ];

  const handleSaveBudget = async (data: BudgetData) => {
    // Only fetch logic kept as mock
    if (data.type === 'Dalam Daerah') setDalamDaerah({ total: data.total, used: data.used });
    else setLuarDaerah({ total: data.total, used: data.used });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Disetujui":
        return <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1 w-max mx-auto"><CheckCircle className="w-3 h-3" /> Disetujui</span>;
      case "Ditolak":
        return <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-1 w-max mx-auto"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default:
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1 w-max mx-auto"><Clock className="w-3 h-3" /> Menunggu Persetujuan</span>;
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

  const filterData = (data: LaporanData[], search: string, filter: string) => {
    return data.filter(item => {
      const matchSearch = (item.noSppd || item.no_sppd || '').toLowerCase().includes(search.toLowerCase()) || 
                          (item.kota || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'Semua' || item.tipePerjalanan === filter;
      return matchSearch && matchFilter;
    });
  };

  const filteredSubKegiatanData = allSubKegiatan.filter(sk => {
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
          <h2 className="text-4xl font-bold tracking-tight text-[#00475e] mb-1">Dashboard Kepala Bidang</h2>
          <p className="text-[#40484d] max-w-2xl">
            Pantau status pengajuan perjalanan dinas, realisasi anggaran, dan panduan operasional terbaru di lingkungan Diskoperindag Berau.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <BudgetSection 
              dalamDaerahTotal={dalamDaerah.total}
              dalamDaerahUsed={dalamDaerah.used}
              luarDaerahTotal={luarDaerah.total}
              luarDaerahUsed={luarDaerah.used}
            />

            {/* Sub Kegiatan Budget Table */}
            {allSubKegiatan.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm mt-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
                    Semua Pagu & Realisasi Sub Kegiatan
                  </h3>
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
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pagu (Luar)</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (Luar)</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedSubKegiatan.map((sk, idx) => {
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <p className="font-semibold text-[#00475e] text-xs leading-tight max-w-xs">{sk.nama}</p>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                              Rp {sk.paguDalamDaerah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                              Rp {sk.realisasiDalamDaerah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                              Rp {sk.paguLuarDaerah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                              Rp {sk.realisasiLuarDaerah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSkData(sk);
                                  setIsPengurusModalOpen(true);
                                }}
                                className="text-xs bg-slate-100 text-[#00475e] px-3 py-1.5 rounded font-bold hover:bg-slate-200 inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <Users className="w-3.5 h-3.5" /> Detail Pengurus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            )}

            {/* SPPD Monitoring Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm mt-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
                  Pengajuan SPPD Terbaru
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari No. SPPD atau Tujuan..."
                      value={searchPengajuan}
                      onChange={(e) => {
                        setSearchPengajuan(e.target.value);
                        setPagePengajuan(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e]/20 focus:border-[#00475e]"
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={filterPengajuan}
                      onChange={(e) => {
                        setFilterPengajuan(e.target.value);
                        setPagePengajuan(1);
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
                      const statusPeng = pengajuanStatuses[sppd] || 'Menunggu Persetujuan';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-[#00475e]" />
                              {item.kota}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                            Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-600 text-xs">{item.tipePerjalanan}</p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getStatusBadge(statusPeng)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={async () => {
                                const sppdStr = item.noSppd || item.no_sppd || '';
                                const programData = await getProgramData(sppdStr);
                                
                                const pelaksanaList = await getPelaksanaData(sppdStr) || item.pelaksana || [item.pembuat];

                                setSelectedSppd({
                                  ...item,
                                  ...programData.program,
                                  ...programData.dates,
                                  pelaksana: pelaksanaList,
                                  statusPengajuan: statusPeng,
                                  tanggalPersetujuan: await getTanggalPersetujuan(sppdStr)
                                });
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
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Belum ada data pengajuan SPPD</p>
                        </td>
                      </tr>
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
                
                <button
                  onClick={() => window.location.href = '/persetujuan-sppd'}
                  className="text-xs font-semibold text-[#00475e] hover:text-[#003344] flex items-center gap-1 bg-[#e6f3f8] px-4 py-2 rounded-lg transition-colors"
                >
                  Lihat Semua Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
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
                      const spjStatus = laporanStatusMapState[sppd] || item.status || "belum_spj";

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-[#00475e]" />
                              {item.kota}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                            Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getSpjStatusBadge(spjStatus)}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Belum ada data laporan SPJ</p>
                        </td>
                      </tr>
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
                  onClick={() => window.location.href = '/persetujuan-spj'}
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
                      const spjStatus = laporanStatusMapState[sppd] || item.status || "belum_spj";

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#00475e] text-sm">{sppd || '-'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-[#00475e]" />
                              {item.kota}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-600 text-xs">
                            Rp {(item.totalAnggaran || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getSpjStatusBadge(spjStatus)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => {
                                navigate('/kpa/arsip-spj', { state: { redirectSppd: sppd } });
                              }}
                              className="text-xs bg-slate-100 text-[#00475e] px-3 py-1.5 rounded font-medium hover:bg-slate-200 inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Detail
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Belum ada data arsip SPJ</p>
                        </td>
                      </tr>
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
                  onClick={() => window.location.href = '/arsip-spj'}
                  className="text-xs font-semibold text-[#00475e] hover:text-[#003344] flex items-center gap-1 bg-[#e6f3f8] px-4 py-2 rounded-lg transition-colors"
                >
                  Lihat Semua Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <GuideSection />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <ProfileCard />
            <ActivityFeed />
          </div>
        </div>
      </main>

      <BudgetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveBudget}
        initialData={{ year: '2024', type: 'Dalam Daerah', total: 0, used: 0 }}
        mode={dialogMode}
      />
      
      {selectedSppd && (
        <SppdPreviewModal
          isOpen={isSppdModalOpen}
          onClose={() => setIsSppdModalOpen(false)}
          data={selectedSppd}
        />
      )}

      <DetailPengurusModal 
        isOpen={isPengurusModalOpen} 
        onClose={() => setIsPengurusModalOpen(false)} 
        data={selectedSkData} 
      />
    </div>
  );
}
