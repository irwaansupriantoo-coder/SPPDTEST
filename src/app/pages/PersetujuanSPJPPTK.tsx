import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SPJDialog } from "../components/SPJDialog";
import { LuarDaerahDialog } from "../components/LuarDaerahDialog";
import { VerifikasiDokumenDialog } from "../components/VerifikasiDokumenDialog";
import { FilePreviewModal } from "../components/FilePreviewModal";
import { signPdf } from "../utils/pdfSigner";
import { mergePdfs } from "../utils/pdfMerger";
import { apiRequest } from "../utils/supabaseClient";
import { getStatusPengajuan } from "../utils/statusStore";
import { hydrateLaporanDataAsync } from "../utils/hydrateData";
import { logActivity } from "../utils/activityStore";
import {
  getHiddenSppdIds,
  addHiddenSppdId,
  addHiddenSppdIds,
  setLaporanStatus,
  batchGetStatusPengajuan,
  getAllPengajuan,
  setCatatanPerbaikan,
} from "../utils/supabaseDataStore";
import { getSubKegiatanData as getSubKegiatanSync } from "../utils/anggaranStore";
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
  Eye,
  X,
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

export default function PersetujuanSPJPPTK() {
  const { user } = useAuth();
  const [tipePerjalanan, setTipePerjalanan] = useState<
    "Semua" | "Dalam Daerah" | "Luar Daerah"
  >("Semua");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "belum_spj"
    | "menunggu_verifikasi_pegawai"
    | "menunggu_verifikasi_pegawai"
    | "menunggu_verifikasi_bendahara"
    | "menunggu_verifikasi_pptk"
    | "menunggu_verifikasi_kpa"
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedLaporanToReview, setSelectedLaporanToReview] = useState<LaporanData | null>(null);
  const [isRevisiNoteOpen, setIsRevisiNoteOpen] = useState(false);
  const [revisiNote, setRevisiNote] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFileKey, setPreviewFileKey] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const pptkNip = user?.nip || "19951130 202203 2 030";

  const [dalamDaerahData, setDalamDaerahData] = useState<LaporanData[]>([]);
  const [luarDaerahData, setLuarDaerahData] = useState<LaporanData[]>([]);
  const itemsPerPage = 4;

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllPengajuan();
      const serverDalam = data.filter((d: any) => d.tipePerjalanan === 'Dalam Daerah');
      const serverLuar = data.filter((d: any) => d.tipePerjalanan === 'Luar Daerah');

      const hiddenIds = await getHiddenSppdIds();

      // Batch fetch statuses
      const allItems = [...serverDalam, ...serverLuar];
      const noSppdList = allItems.map((d: any) => d.noSppd || d.no_sppd || '');
      const statusMap = await batchGetStatusPengajuan(noSppdList);

      // Filter to only show approved (Disetujui) ones.
      const isApproved = (item: LaporanData) => {
        if (hiddenIds.includes(item.noSppd)) return false;
        if (!item.noSppd?.includes('SPPD-V2')) return false;

        const status = statusMap[item.noSppd] || 'Menunggu Persetujuan';
        return status === "Disetujui";
      };

      const hydratedDalam = await Promise.all(serverDalam.filter(isApproved).map(hydrateLaporanDataAsync));
      setDalamDaerahData(hydratedDalam.filter(d => d.status !== 'selesai' && d.status !== 'belum_spj' && d.status !== 'draft_laporan'));
      
      const hydratedLuar = await Promise.all(serverLuar.filter(isApproved).map(hydrateLaporanDataAsync));
      setLuarDaerahData(hydratedLuar.filter(d => d.status !== 'selesai' && d.status !== 'belum_spj' && d.status !== 'draft_laporan'));
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

  // Get data based on tipe perjalanan
  const allData =
    tipePerjalanan === "Semua"
      ? [...dalamDaerahData, ...luarDaerahData]
      : tipePerjalanan === "Dalam Daerah"
      ? dalamDaerahData
      : luarDaerahData;

  // Filter data based on status and search
  const filteredData = allData.filter((item) => {
    // Check if the SPJ subKegiatan is assigned to this PPTK (sync check using cached data)
    const subKegiatanList = getSubKegiatanSync();
    let isOwned = false;
    if (subKegiatanList.length > 0 && item.subKegiatan) {
      isOwned = subKegiatanList.some((sk: any) => sk.nama === item.subKegiatan && sk.pptkNip === pptkNip);
    } else {
      // For mock data backward compatibility
      isOwned = true; 
    }

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
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
    return matchesStatus && matchesSearch && isOwned;
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
    belum_spj: filteredData.filter((d) => d.status === "belum_spj")
      .length,
    menunggu_verifikasi_pptk: filteredData.filter(
      (d) => d.status === "menunggu_verifikasi_pptk",
    ).length,
  };

  const handleExportRekap = () => {
    // Prepare data for Excel
    const exportData = filteredData.map((item) => ({
      "No. SPT": item.noSpt,
      "No. SPPD": item.noSppd,
      "Pembuat Laporan": item.pembuat.nama,
      NIP: item.pembuat.nip,
      "Kota Tujuan": item.kota,
      "Total Anggaran": item.totalAnggaran,
      Status:
        item.status === "belum_spj"
          ? "Belum SPJ"
          : item.status === "menunggu_verifikasi_bendahara"
            ? "Menunggu Verifikasi Bendahara"
            : item.status === "menunggu_verifikasi_pptk"
            ? "Menunggu Verifikasi PPTK"
            : item.status === "menunggu_verifikasi_kpa"
            ? "Menunggu Verifikasi KPA"
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

  const handleSaveSPJ = async (spjData?: any) => {
    if (!selectedLaporan) return;

    // Optimistic UI update
    const updateLocal = (prevData: LaporanData[]) =>
      prevData.map((item) =>
        item.noSppd === selectedLaporan.noSppd
          ? { ...item, status: "menunggu_verifikasi_kpa" as const }
          : item,
      );

    if (tipePerjalanan === "Dalam Daerah") {
      setDalamDaerahData(updateLocal);
    } else {
      setLuarDaerahData(updateLocal);
    }

    // Persist to server if item has a server-side id
    if ((selectedLaporan as any).id) {
      try {
        await apiRequest(`/laporan/${(selectedLaporan as any).id}`, {
          method: 'POST',
          body: JSON.stringify(spjData ?? {}),
        });
      } catch (err) {
        console.log('Error saving SPJ to server:', err);
      }
    }
  };

  const handleViewDoc = async (docId: string, docName: string, nip?: string) => {
    if (!selectedLaporanToReview) return;
    let key = "";
    if (docId === 'kwitansi') key = `sppd_kwitansi_${selectedLaporanToReview.noSppd}`;
    else if (docId === 'sppd') key = `sppd_tervisum_${selectedLaporanToReview.noSppd}`;
    else if (docId === 'laporan') key = `sppd_laporan_${selectedLaporanToReview.noSppd}`;
    else if (docId === 'rincian') key = `sppd_rincian_${selectedLaporanToReview.noSppd}`;
    else if (docId === 'dokumentasi') key = `sppd_dokumentasi_${selectedLaporanToReview.noSppd}`;
    else if (docId === 'penginapan') {
      const keys = selectedLaporanToReview.pelaksana.map((p: any) => `sppd_hotel_${selectedLaporanToReview.noSppd}_${p.nip}`);
      try {
        toast.info("Menggabungkan file penginapan...");
        key = await mergePdfs(keys, `temp_penginapan_${selectedLaporanToReview.noSppd.replace(/\//g, '_')}`);
      } catch (err) {
        toast.error("Tidak ada file penginapan yang dapat digabungkan");
        return;
      }
    }
    else if (docId === 'transportasi') {
      const keys = selectedLaporanToReview.pelaksana.map((p: any) => `sppd_kendaraan_${selectedLaporanToReview.noSppd}_${p.nip}`);
      try {
        toast.info("Menggabungkan file transportasi...");
        key = await mergePdfs(keys, `temp_transportasi_${selectedLaporanToReview.noSppd.replace(/\//g, '_')}`);
      } catch (err) {
        toast.error("Tidak ada file transportasi yang dapat digabungkan");
        return;
      }
    }
    else {
        toast.info(`Dokumen ${docName} akan digenerate otomatis atau diunggah terpisah.`);
        return;
    }
    
    setPreviewFileKey(key);
    setPreviewTitle(docName);
    setIsPreviewOpen(true);
  };

  const handleDeleteItem = async (noSppd: string) => {
    if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
      await addHiddenSppdId(noSppd);
      setDalamDaerahData(prev => prev.filter(item => item.noSppd !== noSppd));
      setLuarDaerahData(prev => prev.filter(item => item.noSppd !== noSppd));
      toast.success('Data berhasil dihapus permanen.');
    }
  };

  const getStatusBadge = (status: LaporanData["status"]) => {
    switch (status) {
      case "belum_spj":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            Belum SPJ
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
      case "selesai":
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            Selesai/Cair
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
                Persetujuan SPJ
              </h3>
              <p className="text-[#40484d] mt-3 text-lg leading-relaxed">
                Review dan setujui laporan pertanggungjawaban (SPJ) dari pengelola.
              </p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={async () => {
                    if(window.confirm('Yakin ingin menghapus semua data persetujuan SPJ secara permanen?')) {
                      const newHidden = allData.map(p => p.noSppd);
                      await addHiddenSppdIds(newHidden);
                      setDalamDaerahData([]);
                      setLuarDaerahData([]);
                      toast.success('Semua data persetujuan SPJ berhasil dihapus permanen.');
                      setTimeout(() => window.location.reload(), 1000);
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
                      e.target.value as "Semua" | "Dalam Daerah" | "Luar Daerah",
                    )
                  }
                  className="w-full appearance-none bg-white border-none rounded-xl py-3.5 px-5 pr-12 text-[#191c1e] font-medium shadow-sm focus:ring-2 focus:ring-[#00475e]/20 cursor-pointer outline-none"
                >
                  <option value="Semua">Semua Tipe Perjalanan</option>
                  <option value="Dalam Daerah">Pengajuan Dalam Daerah</option>
                  <option value="Luar Daerah">Pengajuan Luar Daerah</option>
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

            <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    statusFilter === "menunggu_verifikasi_pptk"
                      ? "all"
                      : "menunggu_verifikasi_pptk",
                  )
                }
                className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  statusFilter === "menunggu_verifikasi_pptk"
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
                        stats.menunggu_verifikasi_pptk,
                      ).padStart(2, "0")}{" "}
                      Berkas
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
                Daftar Antrian Verifikasi SPJ
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
                          <div className="flex items-center justify-center">
                            {getStatusBadge(item.status)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {item.status === "menunggu_verifikasi_pptk" ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLaporanToReview(item);
                                  setIsReviewDialogOpen(true);
                                }}
                                className="px-3 py-1.5 bg-[#00475e] text-white rounded-lg text-xs font-bold hover:bg-[#1a5f7a] shadow-sm transition-all active:scale-95 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" /> Periksa
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
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLaporanToReview(item);
                                  setIsReviewDialogOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 shadow-sm transition-all active:scale-95 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" /> Lihat Detail
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
                  {tipePerjalanan.toLowerCase()}
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

      {/* Review Dialog using VerifikasiDokumenDialog */}
      <VerifikasiDokumenDialog
        isOpen={isReviewDialogOpen}
        onClose={() => {
          setIsReviewDialogOpen(false);
          setSelectedLaporanToReview(null);
        }}
        data={selectedLaporanToReview}
        footerActions={
          selectedLaporanToReview?.status === "menunggu_verifikasi_pptk" ? (
            <>
              <button
                onClick={() => setIsRevisiNoteOpen(true)}
                className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Revisi
              </button>
              <button
                onClick={async () => {
                  const toastId = toast.loading("Menandatangani dokumen...");
                  try {
                    if (selectedLaporanToReview.tipePerjalanan === "Luar Daerah") {
                      const successRincian = await signPdf(`sppd_rincian_${selectedLaporanToReview.noSppd}`, "PPTK", "Rahmawati", "199511302022032030");
                      if (!successRincian) throw new Error("Gagal menandatangani Rincian.");
                    }
                    const successKwitansi = await signPdf(`sppd_kwitansi_${selectedLaporanToReview.noSppd}`, "PPTK", "Rahmawati", "199511302022032030");
                    if (!successKwitansi) throw new Error("Gagal menandatangani Kwitansi.");
                    
                    const successLaporan = await signPdf(`sppd_laporan_${selectedLaporanToReview.noSppd}`, "PPTK", "Rahmawati", "199511302022032030");
                  } catch(err: any) { 
                    console.error(err);
                    toast.error(err.message || "Terjadi kesalahan saat menandatangani dokumen.", { id: toastId });
                    return;
                  }

                  toast.success("SPJ Disetujui & Diteruskan ke KPA!", { id: toastId });
                  
                  // Catat log aktivitas
                  logActivity(
                    'status_spj',
                    `SPJ ${selectedLaporanToReview.noSppd} Disetujui PPTK`,
                    `Disetujui oleh PPTK (${user?.nama || "PPTK"})`,
                    selectedLaporanToReview.noSppd
                  );

                  const updateLocal = (prevData: LaporanData[]) => prevData.map(d => d.noSppd === selectedLaporanToReview.noSppd ? { ...d, status: "menunggu_verifikasi_kpa" as const } : d);
                  if (selectedLaporanToReview.tipePerjalanan === "Dalam Daerah") setDalamDaerahData(updateLocal);
                  else setLuarDaerahData(updateLocal);
                  
                  try {
                    await setLaporanStatus(selectedLaporanToReview.noSppd, "menunggu_verifikasi_kpa");
                  } catch(e) {}

                  // Optimistically update backend
                  if ((selectedLaporanToReview as any).id) {
                    apiRequest(`/laporan/${(selectedLaporanToReview as any).id}`, {
                      method: 'POST',
                      body: JSON.stringify({ status: "menunggu_verifikasi_kpa" }),
                    }).catch(console.error);
                  }
                  
                  setIsReviewDialogOpen(false);
                  setSelectedLaporanToReview(null);
                }}
                className="px-4 py-2.5 bg-[#00475e] text-white rounded-xl text-sm font-bold hover:bg-[#1a5f7a] shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Setujui
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsReviewDialogOpen(false);
                setSelectedLaporanToReview(null);
              }}
              className="px-6 py-2.5 rounded text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
          )
        }
      />

      {/* Revisi Note Dialog */}
      {isRevisiNoteOpen && selectedLaporanToReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-[#5f3800] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Catatan Revisi
              </h3>
            </div>
            <div className="p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pesan untuk Pengelola
              </label>
              <textarea
                value={revisiNote}
                onChange={(e) => setRevisiNote(e.target.value)}
                rows={4}
                placeholder="Misal: Mohon perbaiki nominal pada kwitansi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
              />
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsRevisiNoteOpen(false);
                  setRevisiNote("");
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  toast.error(`SPJ Dikembalikan untuk Perbaikan! Catatan: ${revisiNote || 'Tidak ada catatan'}`);
                  
                  // Catat log aktivitas
                  logActivity(
                    'status_spj',
                    `SPJ ${selectedLaporanToReview.noSppd} Direvisi (PPTK)`,
                    `Revisi oleh PPTK (${user?.nama || "PPTK"}): ${revisiNote || 'Tidak ada catatan'}`,
                    selectedLaporanToReview.noSppd
                  );

                  const updateLocal = (prevData: LaporanData[]) => prevData.map(d => d.noSppd === selectedLaporanToReview.noSppd ? { ...d, status: "perbaikan" as const, catatanPerbaikan: revisiNote } : d);
                  if (selectedLaporanToReview.tipePerjalanan === "Dalam Daerah") setDalamDaerahData(updateLocal);
                  else setLuarDaerahData(updateLocal);
                  
                  try {
                    await setLaporanStatus(selectedLaporanToReview.noSppd, "perbaikan");
                    await setCatatanPerbaikan(selectedLaporanToReview.noSppd, revisiNote);
                  } catch(e) {}

                  // Optimistically update backend
                  if ((selectedLaporanToReview as any).id) {
                    apiRequest(`/laporan/${(selectedLaporanToReview as any).id}`, {
                      method: 'POST',
                      body: JSON.stringify({ status: "perbaikan", catatan_perbaikan: revisiNote }),
                    }).catch(console.error);
                  }
                  
                  setIsRevisiNoteOpen(false);
                  setRevisiNote("");
                  setIsReviewDialogOpen(false);
                  setSelectedLaporanToReview(null);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-sm transition-all active:scale-95"
              >
                Kirim Revisi
              </button>
            </div>
          </div>
        </div>
      )}

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
          }}
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
          }}
        />
      )}

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileKey={previewFileKey}
        title={previewTitle}
      />
    </div>
  );
}
