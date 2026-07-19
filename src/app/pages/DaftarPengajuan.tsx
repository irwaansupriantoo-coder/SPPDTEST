import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { apiRequest } from "../utils/supabaseClient";
import { getStatusPengajuan, getTanggalPersetujuan, setStatusPengajuan, batchGetStatusPengajuan, batchGetTanggalPersetujuan } from "../utils/statusStore";
import {
  getHiddenSppdIds,
  addHiddenSppdIds,
  getLaporanStatus,
  batchGetLaporanStatus,
  getAppSetting,
  getAllPengajuan,
  deletePengajuan,
} from "../utils/supabaseDataStore";
import { downloadSPPD } from "../utils/generateSPPD";
import { SppdPreviewModal } from "../components/SppdPreviewModal";
import {
  Search,
  Filter,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileDown,
  Eye,
  Copy
} from "lucide-react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";

interface LaporanData {
  id?: string;
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
  isDuplicated?: boolean;
  version?: string;
}

import { useAuth } from "../context/AuthContext";

export default function DaftarPengajuan() {
  const { user } = useAuth();
  const [tipePerjalanan, setTipePerjalanan] = useState<"Semua" | "Dalam Daerah" | "Luar Daerah">("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<LaporanData | null>(null);
  const [allPengajuan, setAllPengajuan] = useState<LaporanData[]>([]);

  const itemsPerPage = 5;

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await getAllPengajuan();
      
      const hiddenIds = await getHiddenSppdIds();

      // Filter out hidden and completed
      const filteredData = data
        .filter((d: any) => d.noSppd?.includes('SPPD') && !hiddenIds.includes(d.noSppd));

      // Batch fetch laporan statuses
      const noSppdList = filteredData.map((d: any) => d.noSppd || d.no_sppd || '');
      const laporanStatuses = await batchGetLaporanStatus(noSppdList);
      const statusMap = await batchGetStatusPengajuan(noSppdList);
      const tanggalMap = await batchGetTanggalPersetujuan(noSppdList);

      const dataWithStatus = filteredData
        .filter((d: any) => {
          const spjStatus = laporanStatuses[d.noSppd] || d.status || "belum_spj";
          return spjStatus !== "selesai";
        })
        .map((d: any) => {
          const sppd = d.noSppd || d.no_sppd || '';
          return {
            ...d,
            noSppd: sppd,
            statusPengajuan: statusMap[sppd] || 'Menunggu Persetujuan',
            tanggalPersetujuan: tanggalMap[sppd] || ''
          };
        });
      
        // Additional local filtering if needed
      const validData = dataWithStatus.filter((d: any) => {
        if (user?.role === 'pengelola') {
          const nip = typeof d.pembuat === 'string' ? null : d.pembuat?.nip;
          const nama = typeof d.pembuat === 'string' ? d.pembuat : d.pembuat?.nama;
          const cleanNip = (nip || '').replace(/\s+/g, '');
          const cleanUserNip = (user?.nip || '').replace(/\s+/g, '');
          const cleanNama = (nama || '').toLowerCase().trim();
          const cleanUserNama = (user?.nama || '').toLowerCase().trim();
          
          if (cleanNip && cleanNip !== cleanUserNip && cleanNama !== cleanUserNama) return false;
        }
        if (d.isDuplicated && d.statusPengajuan !== 'Disetujui') return false;

        return true;
      });

      setAllPengajuan(validData);
    } catch (err) {
      console.log('Error loading pengajuan data:', err);
      toast.error(`Gagal memuat data pengajuan dari server: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetail = (item: LaporanData) => {
    setSelectedDetail(item);
  };

  const handleDownloadSppd = async (item: LaporanData) => {
    toast.info(`Menyiapkan file SPPD untuk ${item.pelaksana.length} orang...`);
    try {
      await downloadSPPD(item);
      toast.success("File SPPD berhasil diunduh untuk semua pelaksana.");
    } catch (error) {
      toast.error("Gagal mengunduh SPPD. Pastikan template tersedia.");
    }
  };

  const handleDeleteItem = async (item: LaporanData) => {
    if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
      if (item.id) {
        await deletePengajuan(item.id);
      } else {
        await addHiddenSppdIds([item.noSppd]);
      }
      setAllPengajuan(prev => prev.filter(p => p.noSppd !== item.noSppd));
      toast.success('Data berhasil dihapus permanen.');
    }
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

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
                Daftar Pengajuan SPPD
              </h3>
              <p className="text-[#40484d] mt-3 text-lg leading-relaxed">
                Review dan setujui pengajuan perjalanan dinas sebelum dilanjutkan ke tahap realisasi (Laporan SPJ).
              </p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={async () => {
                  if(window.confirm('Yakin ingin menghapus semua data pengajuan secara permanen? (Data akan hilang dari tampilan Pengelola dan KPA)')) {
                    // Hide server data in Supabase
                    const newHidden = allPengajuan.map(p => p.noSppd);
                    await addHiddenSppdIds(newHidden);
                    
                    // Delete local IndexedDB
                    indexedDB.deleteDatabase('SppdFilesDB');
                    
                    setAllPengajuan([]);
                    toast.success('Semua data pengajuan berhasil dihapus permanen.');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm whitespace-nowrap"
              >
                Hapus Semua Data
              </button>
            )}
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
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pembuat Pengajuan</th>
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
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(item)}
                                className="px-4 py-2 bg-[#f0f7fb] text-[#00475e] rounded-lg text-xs font-bold hover:bg-[#e6f4fd] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> Detail
                              </button>


                              {item.statusPengajuan === "Disetujui" && (
                                <button
                                  onClick={() => handleDownloadSppd(item)}
                                  className="px-4 py-2 bg-[#00475e] text-white rounded-lg text-xs font-bold hover:bg-[#1a5f7a] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Unduh
                                </button>
                              )}
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteItem(item)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center gap-2"
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
    </div>
  );
}
