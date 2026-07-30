import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SPJDialog } from "../components/SPJDialog";
import { LuarDaerahDialog } from "../components/LuarDaerahDialog";
import { VerifikasiDokumenDialog } from "../components/VerifikasiDokumenDialog";
import { apiRequest } from "../utils/supabaseClient";
import { getStatusPengajuan, batchGetStatusPengajuan } from "../utils/statusStore";
import { hydrateLaporanDataAsync } from "../utils/hydrateData";
import { logActivity } from "../utils/activityStore";
import {  getHiddenSppdIds, addHiddenSppdId, addHiddenSppdIds, setLaporanStatus, setPelaksanaData , getAllPengajuan, deletePengajuanByNoSppd, deletePengajuanByNoSppdList, setTotalAnggaranPengajuan, setCatatanPerbaikan } from "../utils/supabaseDataStore";
import {
  FileDown,
  Search,
  Filter,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  Timer,
  Info,
  AlertTriangle,
  HeadsetIcon,
  Download,
  Eye,
  FileEdit,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";

interface LaporanData {
  noSpt: string;
  noSppd: string;
  pembuat: {
    nama: string;
    nip: string;
  };
  pelaksana: Array<{
    nama: string;
    nip: string;
    statusLaporan?: "sudah_lengkap" | "belum_lengkap";
  }>;
  kota: string;
  totalAnggaran: number;
  status:
    | "belum_spj"
    | "draft_laporan"
    | "menunggu_verifikasi_pegawai"
    | "menunggu_verifikasi_pegawai"
    | "menunggu_verifikasi_bendahara"
    | "menunggu_verifikasi_pptk"
    | "menunggu_verifikasi_kpa"
    | "menunggu_pembayaran"
    | "selesai"
    | "perbaikan";
  tipePerjalanan: "Dalam Daerah" | "Luar Daerah";
  statusPengajuan?: string;
  version?: string;
  tanggalPergi?: string;
  tanggalKembali?: string;
  subKegiatan?: string;
  catatanPerbaikan?: string;
}

import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router';

export default function Laporan() {
  const { user } = useAuth();
  const location = useLocation();
  const [tipePerjalanan, setTipePerjalanan] = useState<
    "Semua" | "Dalam Daerah" | "Luar Daerah"
  >("Semua");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "belum_spj"
    | "menunggu_verifikasi"
    | "menunggu_pembayaran"
    | "selesai"
    | "perbaikan"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLaporan, setSelectedLaporan] =
    useState<LaporanData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLuarDaerahDialogOpen, setIsLuarDaerahDialogOpen] =
    useState(false);
  const [isVerifikasiDialogOpen, setIsVerifikasiDialogOpen] = useState(false);
  const [isRevisiNoteOpen, setIsRevisiNoteOpen] = useState(false);
  const [selectedCatatan, setSelectedCatatan] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [dalamDaerahData, setDalamDaerahData] = useState<LaporanData[]>([]);
  const [luarDaerahData, setLuarDaerahData] = useState<LaporanData[]>([]);
  const itemsPerPage = 4;

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllPengajuan();
      const serverDalam = data.filter((d) => d.tipePerjalanan === 'Dalam Daerah');
      const serverLuar = data.filter((d) => d.tipePerjalanan === 'Luar Daerah');

      const hiddenIds = await getHiddenSppdIds();

      // Filter to only show approved (Disetujui) ones.
      // Also filter by SPPD-V2 to hide old legacy data
      // Filter by pengelola NIP if role is pengelola

      const allSppdIds = [...serverDalam, ...serverLuar].map(d => d.noSppd).filter(Boolean);
      const statusMap = await batchGetStatusPengajuan(allSppdIds);

      const isApproved = (item: LaporanData) => {
        if (hiddenIds.includes(item.noSppd)) return false;
        if (!item.noSppd?.includes('SPPD-V2') && !item.noSppd?.includes('DKPP')) return false;
        if (user?.role === 'pengelola' && item.pembuat?.nip !== user?.nip) return false;

        const status = statusMap[item.noSppd] || "belum_spj";
        return status === "Disetujui";
      };

      const hydratedDalam = await Promise.all(serverDalam.filter(isApproved).map(hydrateLaporanDataAsync));
      setDalamDaerahData(hydratedDalam.filter(d => d.status !== 'selesai'));
      
      const hydratedLuar = await Promise.all(serverLuar.filter(isApproved).map(hydrateLaporanDataAsync));
      setLuarDaerahData(hydratedLuar.filter(d => d.status !== 'selesai'));
    } catch (err) {
      console.log('Error loading laporan data:', err);
      setDalamDaerahData([]);
      setLuarDaerahData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (location.state && location.state.redirectSppd) {
      setSearchQuery(location.state.redirectSppd);
    }
  }, [location.state]);

  // Get data based on tipe perjalanan
  const allData =
    tipePerjalanan === "Semua"
      ? [...dalamDaerahData, ...luarDaerahData]
      : tipePerjalanan === "Dalam Daerah"
      ? dalamDaerahData
      : luarDaerahData;

  // Filter data based on status and search
  const filteredData = allData.filter((item) => {
    const isMenungguVerifikasi = item.status.startsWith("menunggu_verifikasi");
    const matchesStatus =
      statusFilter === "all" || 
      (statusFilter === "menunggu_verifikasi" ? isMenungguVerifikasi : (item.status === statusFilter || (statusFilter === "belum_spj" && ((item.status as any) === "Menunggu Persetujuan" || item.status === "draft_laporan"))));
    const matchesSearch =
      searchQuery === "" ||
      (item.noSpt || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (item.kota || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredData.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Calculate statistics
  const stats = {
    belum_spj: allData.filter((d) => d.status === "belum_spj" || (d.status as any) === "Menunggu Persetujuan" || d.status === "draft_laporan")
      .length,
    menunggu_verifikasi: allData.filter(
      (d) => d.status.startsWith("menunggu_"),
    ).length,
    selesai: allData.filter((d) => d.status === "selesai")
      .length,
  };

  const handleExportRekap = () => {
    // Prepare data for Excel
    const exportData = filteredData.map((item) => ({
      "No. SPT": item.noSpt,
      "No. SPPD": item.noSppd,
      "Pembuat Laporan": typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "Pengelola",
      NIP: typeof item.pembuat === "string" ? "-" : item.pembuat?.nip || "-",
      "Kota Tujuan": item.kota,
      "Total Anggaran": item.totalAnggaran,
      Status:
        (item.status === "belum_spj" || (item.status as any) === "Menunggu Persetujuan" || item.status === "draft_laporan")
          ? "Belum SPJ"
          : item.status === "menunggu_pembayaran"
            ? "Menunggu Pembayaran"
            : item.status.startsWith("menunggu_verifikasi")
              ? "Menunggu Verifikasi"
              : "Selesai/Cair",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan SPJ");

    // Generate filename
    const filename = `Laporan_SPJ_${tipePerjalanan.replace(" ", "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    toast.success(
      "Export rekap berhasil diunduh dalam format Excel",
    );
  };

  const handleBuatLaporan = (data: LaporanData) => {
    if (data.status === "draft_laporan" || data.status === "perbaikan") {
      setSelectedLaporan(data);
      setIsVerifikasiDialogOpen(true);
      return;
    }

    if (data.tipePerjalanan === "Dalam Daerah") {
      setSelectedLaporan(data);
      setIsDialogOpen(true);
    } else {
      toast.success(
        `Membuat laporan untuk ${typeof data.pembuat === "string" ? data.pembuat : data.pembuat?.nama || "Pengelola"}...`,
      );
      setSelectedLaporan(data);
      setIsLuarDaerahDialogOpen(true);
    }
  };

  const handleSaveSPJ = async (travelerData?: any, targetStatus?: string) => {
    if (!selectedLaporan) return;

    // Map travelerData to pelaksana
    const updatedPelaksana = selectedLaporan.pelaksana.map(p => {
      if (travelerData && travelerData[p.nip]) {
        const tData = travelerData[p.nip];
        
        // Handle both Dalam Daerah (flat) and Luar Daerah (nested) structures
        const tiketPesawat = tData.pesawat?.enabled ? (tData.pesawat.subtotal || 0) : (tData.totalPesawat || 0);
        const tiketKereta = tData.keretaApi?.enabled ? (tData.keretaApi.subtotal || 0) : (tData.totalKeretaApi || 0);
        const taxi = tData.taxiBandara?.enabled ? (tData.taxiBandara.subtotal || 0) : (tData.totalTaxiBandara || 0);
        const rep = tData.biayaRepresentatif?.enabled ? (tData.biayaRepresentatif.subtotal || 0) : (tData.totalBiayaRepresentatif || 0);
        
        let tol = tData.totalBiayaTol || 0;
        if (tData.biayaTol?.enabled) {
          const tolStr = String(tData.biayaTol.total || '0');
          tol = parseInt(tolStr.replace(/\D/g, "")) || 0;
        }

        const sewa = tData.sewaKendaraan?.enabled ? (tData.sewaKendaraan.subtotal || 0) : (tData.totalSewaKendaraan || 0);

        return {
          ...p,
          jumlahHari: parseInt(tData.jumlahHari || '0'),
          totalBiayaHotel: tData.totalBiayaHotel || 0,
          totalSewaKendaraan: sewa,
          totalUangHarian: tData.totalUangHarian || 0,
          totalPesawat: tiketPesawat,
          totalKeretaApi: tiketKereta,
          totalBiayaTol: tol,
          totalTaxiBandara: taxi,
          totalBiayaRepresentatif: rep,
        };
      }
      return p;
    });

    const newTotalAnggaran = travelerData 
      ? updatedPelaksana.reduce((sum: number, p: any) => sum + (p.totalBiayaHotel || 0) + (p.totalSewaKendaraan || 0) + (p.totalUangHarian || 0) + (p.totalPesawat || 0) + (p.totalKeretaApi || 0) + (p.totalBiayaTol || 0) + (p.totalTaxiBandara || 0) + (p.totalBiayaRepresentatif || 0), 0)
      : selectedLaporan.totalAnggaran;

    const currentStatus = selectedLaporan.status;
    const newStatus = (targetStatus || "draft_laporan") as any;
    try {
      await setLaporanStatus(selectedLaporan.noSppd, newStatus);
      await setPelaksanaData(selectedLaporan.noSppd, updatedPelaksana);
      if (newStatus === "menunggu_verifikasi_pegawai") {
         await setCatatanPerbaikan(selectedLaporan.noSppd, null);
      }
    } catch(e) {}

    const updateLocal = (prevData: LaporanData[]) =>
      prevData.map((item) =>
        item.noSppd === selectedLaporan.noSppd
          ? { ...item, status: newStatus, pelaksana: updatedPelaksana, totalAnggaran: newTotalAnggaran, ...(newStatus === "menunggu_verifikasi_pegawai" ? { catatanPerbaikan: undefined } : {}) }
          : item,
      );

    if (selectedLaporan.tipePerjalanan === "Dalam Daerah") {
      setDalamDaerahData(updateLocal);
    } else {
      setLuarDaerahData(updateLocal);
    }

    // Catat log aktivitas
    if (newStatus !== currentStatus) {
      logActivity(
        'pembuatan_spj',
        `SPJ ${selectedLaporan.noSppd} Dibuat`,
        `Dibuat oleh ${user?.nama || "Pengelola"}`,
        selectedLaporan.noSppd
      );
    }

    // Persist to server if item has a server-side id
    if ((selectedLaporan as any).id) {
      try {
        await setTotalAnggaranPengajuan((selectedLaporan as any).id, newTotalAnggaran);
      } catch (err) {
        console.log('Error saving SPJ to server:', err);
      }
    }
  };

  const handleDeleteItem = async (noSppd: string) => {
    if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
      try {
        await deletePengajuanByNoSppd(noSppd);
        setDalamDaerahData(prev => prev.filter(item => item.noSppd !== noSppd));
        setLuarDaerahData(prev => prev.filter(item => item.noSppd !== noSppd));
        toast.success('Data berhasil dihapus permanen.');
      } catch (err) {
        console.error('Error deleting SPJ:', err);
        toast.error('Gagal menghapus data.');
      }
    }
  };

  const getStatusBadge = (status: LaporanData["status"]) => {
    switch (status) {
      case "belum_spj":
      case "Menunggu Persetujuan" as any:
      case "draft_laporan":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            {status === "draft_laporan" ? "Draft Laporan" : "Belum SPJ"}
          </span>
        );
      case "menunggu_verifikasi_pegawai":
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            Menunggu Pegawai
          </span>
        );
      case "menunggu_verifikasi_bendahara":
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            Menunggu Bendahara
          </span>
        );
      case "menunggu_verifikasi_pptk":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            Menunggu PPTK
          </span>
        );
      case "menunggu_verifikasi_kpa":
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
            Menunggu KPA
          </span>
        );
      case "menunggu_pembayaran":
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            Menunggu Pembayaran
          </span>
        );
      case "perbaikan":
        return (
          <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200">
            Perbaikan
          </span>
        );
    }
  };

  // Reset to page 1 when changing filters
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tipePerjalanan, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />

      <main className="ml-64 pt-24 pb-16 px-8">
        <div className="space-y-10">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h3 className="text-3xl md:text-4xl font-bold text-[#00475e] tracking-tight">
                Laporan Perjalanan Dinas (SPJ)
              </h3>
              <p className="text-[#40484d] mt-3 text-lg leading-relaxed">
                Kelola dan lengkapi laporan realisasi biaya
                operasional perjalanan dinas untuk efisiensi
                administrasi keuangan daerah.
              </p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={async () => {
                    if(window.confirm('Yakin ingin menghapus semua laporan SPJ secara permanen?')) {
                      try {
                        const allSppdIds = allData.map(p => p.noSppd);
                        await deletePengajuanByNoSppdList(allSppdIds);
                        setDalamDaerahData([]);
                        setLuarDaerahData([]);
                        toast.success('Semua laporan SPJ berhasil dihapus permanen.');
                        setTimeout(() => window.location.reload(), 1000);
                      } catch (err) {
                        console.error('Error deleting all SPJ:', err);
                        toast.error('Gagal menghapus semua data.');
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors shadow-sm whitespace-nowrap"
                >
                  Hapus Semua Data
                </button>
              )}
              <button
                onClick={handleExportRekap}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#191c1e] font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors"
              >
                <FileDown className="w-5 h-5" />
                Export Rekap
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="bg-[#f2f4f6] p-6 rounded-2xl flex flex-col lg:flex-row gap-6 items-center">
            {/* Tipe Perjalanan Dropdown */}
            <div className="w-full lg:w-1/3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pilih Tipe Perjalanan
              </label>
              <div className="relative">
                <select
                  value={tipePerjalanan}
                  onChange={(e) =>
                    setTipePerjalanan(
                      e.target.value as
                        | "Semua"
                        | "Dalam Daerah"
                        | "Luar Daerah",
                    )
                  }
                  className="w-full appearance-none bg-white border-none rounded-xl py-3.5 px-5 pr-12 text-[#191c1e] font-medium shadow-sm focus:ring-2 focus:ring-[#00475e]/20 cursor-pointer outline-none"
                >
                  <option value="Semua">Semua Perjalanan Dinas</option>
                  <option value="Dalam Daerah">
                    Laporan Perjalanan Dinas Dalam Daerah
                  </option>
                  <option value="Luar Daerah">
                    Laporan Perjalanan Dinas Luar Daerah
                  </option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00475e] pointer-events-none">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="hidden lg:block h-12 w-px bg-slate-300"></div>

            {/* Status Cards */}
            <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "belum_spj"
                      ? "all"
                      : "belum_spj",
                  )
                }
                className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  statusFilter === "belum_spj"
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-500">
                      Belum SPJ
                    </p>
                    <p className="text-lg font-bold text-[#00475e]">
                      {stats.belum_spj} Berkas
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "menunggu_verifikasi"
                      ? "all"
                      : "menunggu_verifikasi",
                  )
                }
                className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  statusFilter === "menunggu_verifikasi"
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-500">
                      Menunggu Verifikasi
                    </p>
                    <p className="text-lg font-bold text-[#5f3800]">
                      {String(
                        stats.menunggu_verifikasi,
                      ).padStart(2, "0")}{" "}
                      Berkas
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "selesai"
                      ? "all"
                      : "selesai",
                  )
                }
                className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  statusFilter === "selesai"
                    ? "border-green-300 ring-2 ring-green-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-500">
                      Selesai/Cair
                    </p>
                    <p className="text-lg font-bold text-[#4c616d]">
                      {stats.selesai} Berkas
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/50">
            {/* Search & Filters */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <h4 className="text-lg font-bold text-[#00475e] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Daftar Antrian Laporan
              </h4>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className="w-full bg-[#f2f4f6] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#00475e]/20 outline-none transition-all"
                    placeholder="Cari No. SPT atau Kota Tujuan..."
                    type="text"
                  />
                </div>
                <button className="p-2.5 bg-[#f2f4f6] rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      No. SPT
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      No. SPPD
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Pembuat Laporan
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Kota Tujuan
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                      Total Anggaran
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr
                        key={index}
                        className="hover:bg-[#00475e]/5 transition-colors group"
                      >
                        <td className="px-6 py-5 font-semibold text-[#00475e]">
                          {item.noSpt}
                        </td>
                        <td className="px-6 py-5 text-slate-600">
                          {item.noSppd}
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-[#191c1e]">
                            {typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "Pengelola"}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            NIP. {typeof item.pembuat === "string" ? "-" : item.pembuat?.nip || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#00475e]" />
                            <span className="font-medium">
                              {item.kota}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-[#191c1e]">
                          Rp{" "}
                          {item.totalAnggaran.toLocaleString(
                            "id-ID",
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex justify-center">
                            {getStatusBadge(item.status)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {item.status === "belum_spj" || item.status === "draft_laporan" || item.status === "perbaikan" || item.status === "Menunggu Persetujuan" as any ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleBuatLaporan(item)}
                                className="px-4 py-2 bg-[#00475e] text-white rounded-lg text-xs font-bold hover:bg-[#1a5f7a] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                {item.status === "draft_laporan" ? "Lengkapi Laporan" : "Buat Laporan"}
                              </button>
                              {item.catatanPerbaikan && (
                                <button
                                  onClick={() => {
                                    setSelectedCatatan(item.catatanPerbaikan || "");
                                    setIsRevisiNoteOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <Info className="w-4 h-4" />
                                  Lihat Catatan
                                </button>
                              )}
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDeleteItem(item.noSppd)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLaporan(item);
                                  setIsVerifikasiDialogOpen(true);
                                }}
                                className="px-4 py-2 bg-white border border-[#00475e]/20 text-[#00475e] rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Lihat Dokumen
                              </button>
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDeleteItem(item.noSppd)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="w-16 h-16 mb-4" />
                          <p className="text-lg font-medium">
                            Tidak ada data ditemukan
                          </p>
                          <p className="text-sm mt-1">
                            Coba ubah filter atau kata kunci
                            pencarian
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  Menampilkan {startIndex + 1}-
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredData.length,
                  )}{" "}
                  dari {filteredData.length} data perjalanan{" "}
                  {tipePerjalanan === "Semua" ? "dinas" : tipePerjalanan.toLowerCase()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.max(1, prev - 1),
                      )
                    }
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  {Array.from(
                    { length: totalPages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                        currentPage === page
                          ? "bg-[#00475e] text-white"
                          : "hover:bg-slate-100 text-slate-500"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages, prev + 1),
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-5 items-start">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-[#00475e]">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-[#00475e] mb-1">
                  Panduan Pengisian
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pastikan semua struk belanja dan boarding pass
                  diunggah dalam format PDF atau JPEG
                  berkualitas tinggi.
                </p>
                <a
                  href="#"
                  className="text-xs font-bold text-[#00475e] mt-3 inline-block hover:underline"
                >
                  Unduh PDF Panduan
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-5 items-start">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-[#5f3800]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-[#5f3800] mb-1">
                  Batas Waktu (Deadline)
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Laporan SPJ wajib diselesaikan maksimal 5 hari
                  kerja setelah perjalanan dinas berakhir sesuai
                  Perda No. 12.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-[#00475e] to-[#1a5f7a] p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
              <div className="relative z-10">
                <h5 className="font-bold mb-2">
                  Butuh Bantuan Teknis?
                </h5>
                <p className="text-sm opacity-90 leading-relaxed mb-4">
                  Hubungi tim IT BPKAD atau Admin Diskoperindag
                  jika Anda mengalami kendala saat mengunggah
                  berkas.
                </p>
                <button className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">
                  Kontak Support
                </button>
              </div>
              <HeadsetIcon className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
            </div>
          </div>
        </div>
      </main>

      {/* SPJ Dialog */}
      {selectedLaporan && (
        <SPJDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedLaporan(null);
          }}
          onSave={handleSaveSPJ}
          data={{
            noSpt: selectedLaporan.noSpt,
            noSppd: selectedLaporan.noSppd,
            pelaksana: selectedLaporan.pelaksana,
            tipePerjalanan: selectedLaporan.tipePerjalanan,
            kota: selectedLaporan.kota,
            lamaHari: selectedLaporan.tanggalPergi && selectedLaporan.tanggalKembali 
              ? Math.ceil(Math.abs(new Date(selectedLaporan.tanggalKembali).getTime() - new Date(selectedLaporan.tanggalPergi).getTime()) / (1000 * 60 * 60 * 24)) + 1 
              : 3,
            tanggalMulai: selectedLaporan.tanggalPergi ? new Date(selectedLaporan.tanggalPergi) : new Date(),
            tanggalSelesai: selectedLaporan.tanggalKembali ? new Date(selectedLaporan.tanggalKembali) : new Date(),
          }}
          isEditable={['belum_spj', 'draft_laporan', 'perbaikan'].includes(selectedLaporan.status)}
        />
      )}

      {/* Luar Daerah Dialog */}
      {selectedLaporan && (
        <LuarDaerahDialog
          isOpen={isLuarDaerahDialogOpen}
          onClose={() => {
            setIsLuarDaerahDialogOpen(false);
            setSelectedLaporan(null);
          }}
          onSave={handleSaveSPJ}
          data={{
            noSpt: selectedLaporan.noSpt,
            noSppd: selectedLaporan.noSppd,
            pelaksana: selectedLaporan.pelaksana,
            tipePerjalanan: selectedLaporan.tipePerjalanan,
            tanggalPergi: selectedLaporan.tanggalPergi,
            tanggalKembali: selectedLaporan.tanggalKembali,
            kota: selectedLaporan.kota,
          }}
          isEditable={['belum_spj', 'draft_laporan', 'perbaikan'].includes(selectedLaporan.status)}
        />
      )}

      {/* Verifikasi Dokumen Dialog */}
      {selectedLaporan && (
        <VerifikasiDokumenDialog
          isOpen={isVerifikasiDialogOpen}
          onClose={() => setIsVerifikasiDialogOpen(false)}
          data={{
            noSpt: selectedLaporan.noSpt,
            noSppd: selectedLaporan.noSppd,
            pelaksana: selectedLaporan.pelaksana,
            tipePerjalanan: selectedLaporan.tipePerjalanan,
            kota: selectedLaporan.kota,
            lamaHari: selectedLaporan.tanggalPergi && selectedLaporan.tanggalKembali 
              ? Math.ceil(Math.abs(new Date(selectedLaporan.tanggalKembali).getTime() - new Date(selectedLaporan.tanggalPergi).getTime()) / (1000 * 60 * 60 * 24)) + 1 
              : 3,
            tanggalMulai: selectedLaporan.tanggalPergi ? new Date(selectedLaporan.tanggalPergi) : new Date(),
            tanggalSelesai: selectedLaporan.tanggalKembali ? new Date(selectedLaporan.tanggalKembali) : new Date(),
            program: (selectedLaporan as any).program,
            kegiatan: (selectedLaporan as any).kegiatan,
            subKegiatan: (selectedLaporan as any).subKegiatan,
            maksud: (selectedLaporan as any).maksud,
            pembuat: selectedLaporan.pembuat,
            totalAnggaran: selectedLaporan.totalAnggaran,
            status: selectedLaporan.status,
          }}
          onSubmitUlang={async (targetStatus?: string) => {
            await handleSaveSPJ(undefined, targetStatus || 'menunggu_verifikasi_pegawai');
            toast.success("Dokumen berhasil disubmit");
          }}
        />
      )}

      {/* Revisi Note Dialog */}
      {isRevisiNoteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-[#5f3800] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Catatan Revisi Pegawai
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedCatatan || "Tidak ada catatan."}
              </p>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRevisiNoteOpen(false);
                  setSelectedCatatan("");
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}