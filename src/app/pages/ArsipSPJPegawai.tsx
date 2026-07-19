import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SPJDialog } from "../components/SPJDialog";
import { LuarDaerahDialog } from "../components/LuarDaerahDialog";
import { VerifikasiDokumenDialog } from "../components/VerifikasiDokumenDialog";
import { apiRequest } from "../utils/supabaseClient";
import { getStatusPengajuan, batchGetStatusPengajuan } from "../utils/statusStore";
import { batchGetLaporanStatus, batchGetPelaksanaData, batchGetProgramData, getHiddenSppdIds } from "../utils/supabaseDataStore";
import {
  FileDown,
  Search,
  Filter,
  MapPin,
  FileText,
  Info,
  AlertTriangle,
  HeadsetIcon,
  Eye,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";

interface LaporanData {
  noSpt: string;
  noSppd: string;
  no_sppd?: string;
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
    | "menunggu_verifikasi_kpa"
    | "menunggu_pembayaran"
    | "selesai"
    | "perbaikan";
  tipePerjalanan: "Dalam Daerah" | "Luar Daerah";
  statusPengajuan?: string;
  version?: string;
}

const MOCK_DATA_DALAM_DAERAH: LaporanData[] = [];
const MOCK_DATA_LUAR_DAERAH: LaporanData[] = [];

export default function ArsipSPJPegawai() {
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userJson ? JSON.parse(userJson) : null;
  const [tipePerjalanan, setTipePerjalanan] = useState<
    "Semua Laporan" | "Dalam Daerah" | "Luar Daerah"
  >("Semua Laporan");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "belum_spj"
    | "menunggu_verifikasi"
    | "selesai"
    | "perbaikan"
  >("selesai");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLaporan, setSelectedLaporan] =
    useState<LaporanData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLuarDaerahDialogOpen, setIsLuarDaerahDialogOpen] =
    useState(false);
  const [isVerifikasiDialogOpen, setIsVerifikasiDialogOpen] = useState(false);
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

      const combinedDalam = [...serverDalam, ...MOCK_DATA_DALAM_DAERAH];
      const combinedLuar = [...serverLuar, ...MOCK_DATA_LUAR_DAERAH];

      const allSppdIds = [...combinedDalam, ...combinedLuar].map(d => d.noSppd).filter(Boolean);
      const [statusMap, laporanStatusMap, hiddenIds, pelaksanaMap, programDataMap] = await Promise.all([
        batchGetStatusPengajuan(allSppdIds),
        batchGetLaporanStatus(allSppdIds),
        getHiddenSppdIds(),
        batchGetPelaksanaData(allSppdIds),
        batchGetProgramData(allSppdIds),
      ]);

      const isApproved = (item: LaporanData) => {
        if (hiddenIds.includes(item.noSppd)) return false;
        if (!item.noSppd?.includes('SPPD-V2')) return false;

        const status = statusMap[item.noSppd] || "belum_spj";
        return status === "Disetujui" || (status === "Menunggu Persetujuan" && !((item as any).id));
      };

      const hydrateData = (d: any) => {
        const status = laporanStatusMap[d.noSppd] || d.status || "belum_spj";
        
        let hydratedPelaksana = d.pelaksana;
        let hydratedTotalAnggaran = d.totalAnggaran;

        try {
          const storedPelaksana = pelaksanaMap[d.noSppd];
          if (storedPelaksana && storedPelaksana.length > 0) {
            hydratedPelaksana = storedPelaksana;
            hydratedTotalAnggaran = hydratedPelaksana.reduce((sum: number, p: any) => sum + (p.totalBiayaHotel || 0) + (p.totalSewaKendaraan || 0) + (p.totalUangHarian || 0) + (p.totalPesawat || 0) + (p.totalKeretaApi || 0) + (p.totalBiayaTol || 0), 0);
          }
        } catch(e) {}

        try {
          const parsedProgram = programDataMap[d.noSppd] || {};
          return { ...d, status, pelaksana: hydratedPelaksana, totalAnggaran: hydratedTotalAnggaran, ...parsedProgram };
        } catch (e) {
          return { ...d, status, pelaksana: hydratedPelaksana, totalAnggaran: hydratedTotalAnggaran };
        }
      };

      const hydratedDalam = combinedDalam.filter(isApproved).map(hydrateData);
      const hydratedLuar = combinedLuar.filter(isApproved).map(hydrateData);

      const isPegawai = user?.role === 'pegawai';
      const userNip = (user?.nip || "").replace(/\D/g, "");

      const filterByNip = (item: LaporanData) => {
        if (!isPegawai || !userNip) return true;
        if (Array.isArray(item.pelaksana)) {
          return item.pelaksana.some((p: any) => (p.nip || "").replace(/\D/g, "") === userNip);
        }
        return false;
      };

      setDalamDaerahData(hydratedDalam.filter(filterByNip).filter(d => d.status !== 'belum_spj' && d.status !== 'draft_laporan'));
      setLuarDaerahData(hydratedLuar.filter(filterByNip).filter(d => d.status !== 'belum_spj' && d.status !== 'draft_laporan'));
    } catch (err) {
      console.log('Error loading laporan data:', err);
      setDalamDaerahData(MOCK_DATA_DALAM_DAERAH);
      setLuarDaerahData(MOCK_DATA_LUAR_DAERAH);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allData =
    tipePerjalanan === "Semua Laporan"
      ? [...dalamDaerahData, ...luarDaerahData]
      : tipePerjalanan === "Dalam Daerah"
      ? dalamDaerahData
      : luarDaerahData;

  const filteredData = allData.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      (item.noSppd || item.no_sppd || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
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

  const totalPages = Math.ceil(
    filteredData.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleExportRekap = () => {
    const exportData = filteredData.map((item) => ({
      "No. SPT": item.noSpt,
      "No. SPPD": item.noSppd,
      "Pembuat Laporan": typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "Pengelola",
      NIP: typeof item.pembuat === "string" ? "-" : item.pembuat?.nip || "-",
      "Kota Tujuan": item.kota,
      "Total Anggaran": item.totalAnggaran,
      Status:
        item.status === "belum_spj"
          ? "Belum SPJ"
          : item.status === "menunggu_verifikasi_kpa"
            ? "Menunggu Verifikasi KPA"
            : item.status === "menunggu_pembayaran"
              ? "Menunggu Pembayaran"
              : "Selesai/Cair",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan SPJ");

    const filename = `Laporan_SPJ_${tipePerjalanan.replace(" ", "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, filename);

    toast.success(
      "Export rekap berhasil diunduh dalam format Excel",
    );
  };

  const handleSaveSPJ = async (spjData?: any) => {
    if (!selectedLaporan) return;

    const updateLocal = (prevData: LaporanData[]) =>
      prevData.map((item) =>
        item.noSpt === selectedLaporan.noSpt
          ? { ...item, status: "menunggu_verifikasi_kpa" as const }
          : item,
      );

    if (tipePerjalanan === "Dalam Daerah") {
      setDalamDaerahData(updateLocal);
    } else {
      setLuarDaerahData(updateLocal);
    }

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

  const handleDeleteItem = (noSppd: string) => {
    if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
      const currentHidden = JSON.parse(localStorage.getItem('hidden_sppd_ids') || '[]');
      localStorage.setItem('hidden_sppd_ids', JSON.stringify([...currentHidden, noSppd]));
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
      case "selesai":
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            Selesai/Cair
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
                Arsip Laporan (SPJ)
              </h3>
              <p className="text-[#40484d] mt-3 text-lg leading-relaxed">
                Daftar arsip laporan pertanggungjawaban (SPJ) perjalanan dinas yang telah selesai.
              </p>
            </div>
            <div className="flex gap-3">
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
                        | "Semua Laporan"
                        | "Dalam Daerah"
                        | "Luar Daerah",
                    )
                  }
                  className="w-full appearance-none bg-white border-none rounded-xl py-3.5 px-5 pr-12 text-[#191c1e] font-medium shadow-sm focus:ring-2 focus:ring-[#00475e]/20 cursor-pointer outline-none"
                >
                  <option value="Semua Laporan">
                    Semua Laporan (Dalam & Luar Daerah)
                  </option>
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

          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/50">
            {/* Search & Filters */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <h4 className="text-lg font-bold text-[#00475e] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Arsip Laporan Selesai
              </h4>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value === "") {
                        setStatusFilter("selesai");
                      }
                    }}
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
      {/* Verifikasi Dialog */}
      <VerifikasiDokumenDialog
        isOpen={isVerifikasiDialogOpen}
        onClose={() => {
          setIsVerifikasiDialogOpen(false);
          setSelectedLaporan(null);
        }}
        data={selectedLaporan}
      />
    </div>
  );
}
