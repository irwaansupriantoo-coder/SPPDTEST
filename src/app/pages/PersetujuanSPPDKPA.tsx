import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { apiRequest } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { getStatusPengajuan, setStatusPengajuan, getTanggalPersetujuan } from "../utils/statusStore";
import { getFileFromDB } from "../utils/db";
import { logActivity } from "../utils/activityStore";
import {
  getHiddenSppdIds,
  addHiddenSppdId,
  getLaporanStatus,
  batchGetLaporanStatus,
  batchGetStatusPengajuan,
  batchGetTanggalPersetujuan,
  getAllPengajuan,
} from "../utils/supabaseDataStore";
import { SppdPreviewModal } from "../components/SppdPreviewModal";
import { ApprovalModal } from "../components/ApprovalModal";
import {
  Search,
  Filter,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2
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
  }>;
  kota: string;
  totalAnggaran: number;
  tipePerjalanan: "Dalam Daerah" | "Luar Daerah";
  statusPengajuan?: string; // Menunggu Persetujuan | Disetujui | Ditolak
  version?: string;
}

export default function PersetujuanSPPDKPA() {
  const { user } = useAuth();
  const [tipePerjalanan, setTipePerjalanan] = useState<"Semua" | "Dalam Daerah" | "Luar Daerah">("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [allPengajuan, setAllPengajuan] = useState<LaporanData[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<LaporanData | null>(null);
  const [approvalItem, setApprovalItem] = useState<LaporanData | null>(null);

  const itemsPerPage = 5;

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllPengajuan();
      
      const hiddenIds = await getHiddenSppdIds();

      const filtered = data.filter((d: any) => {
        const sppd = d.noSppd || d.no_sppd || '';
        return sppd.includes('SPPD') && !hiddenIds.includes(sppd);
      });

      // Batch fetch statuses
      const noSppdList = filtered.map((d: any) => d.noSppd || d.no_sppd || '');
      const laporanStatuses = await batchGetLaporanStatus(noSppdList);
      const statusMap = await batchGetStatusPengajuan(noSppdList);
      const tanggalMap = await batchGetTanggalPersetujuan(noSppdList);

      const dataWithStatus = await Promise.all(filtered
        .filter((d: any) => {
          const sppd = d.noSppd || d.no_sppd || '';
          const spjStatus = laporanStatuses[sppd] || d.status || "belum_spj";
          return spjStatus !== "selesai";
        })
        .map(async (d: any) => {
          const sppd = d.noSppd || d.no_sppd || '';
          return {
            ...d,
            noSppd: sppd,
            statusPengajuan: statusMap[sppd] || 'Menunggu Persetujuan',
            tanggalPersetujuan: tanggalMap[sppd] || '',
            sptFileUrl: (await getFileFromDB(`spt_${sppd}`).catch(() => null)) || d.sptFileUrl,
            dasarSuratFileUrl: (await getFileFromDB(`dasar_${sppd}`).catch(() => null)) || d.dasarSuratFileUrl
          };
        }));

      setAllPengajuan(dataWithStatus);
    } catch (err) {
      console.log('Error loading pengajuan data:', err);
      toast.error('Gagal memuat data pengajuan dari server');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (noSppd: string) => {
    await setStatusPengajuan(noSppd, "Disetujui");
    
    toast.success("Pengajuan berhasil disetujui");
    
    // Catat log aktivitas
    logActivity(
      'status_sppd',
      `SPPD ${noSppd} Disetujui`,
      `Disetujui oleh KPA (${user?.nama || "KPA"})`,
      noSppd
    );
    
    // Update local state
    setAllPengajuan(prev => prev.map(p => p.noSppd === noSppd ? { ...p, statusPengajuan: "Disetujui" } : p));
  };

  const handleReject = async (noSppd: string) => {
    await setStatusPengajuan(noSppd, "Ditolak");
    
    // Cari id pengajuan_sppd untuk update di table utama jika perlu
    const item = allPengajuan.find(p => p.noSppd === noSppd);
    if (item && (item as any).id) {
      const { updatePengajuan } = await import('../utils/supabaseDataStore');
      await updatePengajuan((item as any).id, { status: "Ditolak" }).catch(e => console.error(e));
    }

    toast.error("Pengajuan ditolak");
    
    // Catat log aktivitas
    logActivity(
      'status_sppd',
      `SPPD ${noSppd} Ditolak`,
      `Ditolak oleh KPA (${user?.nama || "KPA"})`,
      noSppd
    );
    
    // Update local state
    setAllPengajuan(prev => prev.map(p => p.noSppd === noSppd ? { ...p, statusPengajuan: "Ditolak" } : p));
  };

  const handleDeleteItem = async (noSppd: string) => {
    if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
      await addHiddenSppdId(noSppd);
      setAllPengajuan(prev => prev.filter(item => item.noSppd !== noSppd));
      toast.success('Data berhasil dihapus permanen.');
    }
  };

  const handleViewDetail = (item: LaporanData) => {
    setSelectedDetail(item);
  };



  // Filter data based on tipe perjalanan and search
  const filteredData = allPengajuan.filter((item) => {
    const matchesTipe = tipePerjalanan === "Semua" || item.tipePerjalanan === tipePerjalanan;
    const matchesSearch =
      searchQuery === "" ||
      (item.noSpt || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.kota || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTipe && matchesSearch;
  });

  // Urutkan agar data terbaru tampil di atas
  const sortedData = [...filteredData].reverse();

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Disetujui":
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1 w-max mx-auto">
            <CheckCircle className="w-3 h-3" /> Disetujui
          </span>
        );
      case "Ditolak":
        return (
          <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-1 w-max mx-auto">
            <XCircle className="w-3 h-3" /> Ditolak
          </span>
        );
      default: // Menunggu Persetujuan
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1 w-max mx-auto">
            <Clock className="w-3 h-3" /> Menunggu Persetujuan
          </span>
        );
    }
  };

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
                Persetujuan SPPD
              </h3>
              <p className="text-[#40484d] mt-3 text-lg leading-relaxed">
                Review dan setujui pengajuan perjalanan dinas yang diajukan oleh pengelola.
              </p>
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
                  onChange={(e) => setTipePerjalanan(e.target.value as "Semua" | "Dalam Daerah" | "Luar Daerah")}
                  className="w-full appearance-none bg-white border-none rounded-xl py-3.5 px-5 pr-12 text-[#191c1e] font-medium shadow-sm focus:ring-2 focus:ring-[#00475e]/20 cursor-pointer outline-none"
                >
                  <option value="Semua">Semua Tipe Perjalanan</option>
                  <option value="Dalam Daerah">Pengajuan Dalam Daerah</option>
                  <option value="Luar Daerah">Pengajuan Luar Daerah</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00475e] pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="w-full lg:flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-none rounded-xl py-3.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#00475e]/20 outline-none shadow-sm transition-all"
                placeholder="Cari No. SPT atau Kota Tujuan..."
                type="text"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/50">
            {isLoadingData ? (
              <div className="p-12 text-center text-slate-500">Memuat data pengajuan...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SPT</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. SPPD</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pembuat Laporan</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kota Tujuan</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => (
                        <tr key={index} className="hover:bg-[#00475e]/5 transition-colors group">
                          <td className="px-6 py-5 font-semibold text-[#00475e]">{item.noSpt}</td>
                          <td className="px-6 py-5 text-slate-600">{item.noSppd}</td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#191c1e]">{typeof item.pembuat === "string" ? item.pembuat : item.pembuat?.nama || "Pengelola"}</p>
                            <p className="text-xs text-slate-500 font-medium">NIP. {typeof item.pembuat === "string" ? "-" : item.pembuat?.nip || "-"}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#00475e]" />
                              <span className="font-medium">{item.kota}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {getStatusBadge(item.statusPengajuan)}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {item.statusPengajuan === "Disetujui" ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleViewDetail(item)}
                                  className="px-4 py-2 bg-[#f0f7fb] text-[#00475e] rounded-lg text-xs font-bold hover:bg-[#e6f4fd] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" /> Detail
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteItem(item.noSppd)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            ) : item.statusPengajuan === "Ditolak" ? (
                              <div className="flex justify-center gap-2 items-center">
                                <span className="text-xs text-slate-400 font-medium italic">Tidak ada aksi</span>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteItem(item.noSppd)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => setApprovalItem(item)}
                                  className="px-4 py-2 bg-[#f0f7fb] text-[#00475e] rounded-lg text-xs font-bold hover:bg-[#e6f4fd] shadow-sm transition-all active:scale-95 flex items-center gap-2 border border-[#00475e]/20"
                                >
                                  <Eye className="w-4 h-4" /> Lihat
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteItem(item.noSppd)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-2"
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
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">Belum ada pengajuan</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                        currentPage === page ? "bg-[#00475e] text-white" : "hover:bg-slate-100 text-slate-500"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Sppd Preview Modal */}
      <SppdPreviewModal 
        isOpen={!!selectedDetail} 
        onClose={() => setSelectedDetail(null)} 
        data={selectedDetail} 
      />
      
      {/* Approval Modal */}
      <ApprovalModal
        isOpen={!!approvalItem}
        onClose={() => setApprovalItem(null)}
        data={approvalItem}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
