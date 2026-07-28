import React, { useState, useEffect, useRef } from "react";
import { X, User, Receipt, BarChart2, ClipboardList, BadgeCheck, Car, Bed, CheckCircle2, FileDown, Eye, Wallet, Upload, Check, RefreshCw, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { saveFile, getFile, deleteFilesContaining } from '../utils/fileStore';
import { mergePdfs } from '../utils/pdfMerger';
import { toast } from "sonner";
import { exportRincianDalamDaerah } from "../utils/exportExcelDalamDaerah";
import { exportKwitansiDalamDaerah } from "../utils/exportKwitansiDalamDaerah";
import { KwitansiPreviewModal } from "./KwitansiPreviewModal";
import { RincianPreviewModal } from "./RincianPreviewModal";
import { FilePreviewModal } from "./FilePreviewModal";
import { getBuktiPembayaran } from "../utils/supabaseDataStore";
import { get } from 'idb-keyval';
import { reapplyBarcodes } from '../utils/barcodeReapplier';

interface VerifikasiDokumenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onSubmitUlang?: (targetStatus?: string) => void;
  footerActions?: React.ReactNode;
}

export function VerifikasiDokumenDialog({ isOpen, onClose, data, onSubmitUlang, footerActions }: VerifikasiDokumenDialogProps) {
  const [isKwitansiPreviewOpen, setIsKwitansiPreviewOpen] = useState(false);
  const [isRincianPreviewOpen, setIsRincianPreviewOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFileKey, setPreviewFileKey] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [buktiPembayaran, setBuktiPembayaran] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (data?.noSppd) {
      const checkFiles = async () => {
        const bp = await getBuktiPembayaran(data.noSppd);
        if (bp) setBuktiPembayaran(bp);

        const keysToCheck = [
          { id: 'kwitansi', key: `sppd_kwitansi_${data.noSppd}` },
          { id: 'rincian', key: `sppd_rincian_${data.noSppd}` },
          { id: 'sppd', key: `sppd_tervisum_${data.noSppd}` },
          { id: 'laporan', key: `sppd_laporan_${data.noSppd}` },
          { id: 'dokumentasi', key: `sppd_dokumentasi_${data.noSppd}` },
          { id: 'bukti_pembayaran', key: `sppd_bukti_pembayaran_${data.noSppd}` }
        ];

        const newUploadedFiles: Record<string, string> = {};
        
        const promises = keysToCheck.map(async (item) => {
          try {
            let file = await getFile(item.key);
            if (file) {
              return { id: item.id, value: file instanceof File ? file.name : 'Terunggah' };
            } else if (item.id === 'bukti_pembayaran' && bp) {
              return { id: item.id, value: bp };
            }
          } catch (e) {
            if (item.id === 'bukti_pembayaran' && bp) {
              return { id: item.id, value: bp };
            }
          }
          return null;
        });

        const pelaksanaPromises: Promise<{ id: string, value: string } | null>[] = [];
        if (data.pelaksana && Array.isArray(data.pelaksana)) {
          for (const p of data.pelaksana) {
            const types = [
              { id: 'penginapan', prefix: 'hotel' },
              { id: 'transportasi', prefix: 'kendaraan' },
              { id: 'pesawat_pergi', prefix: 'pesawat_pergi' },
              { id: 'pesawat_pulang', prefix: 'pesawat_pulang' },
              { id: 'kereta_api', prefix: 'kereta' },
              { id: 'taxi_pergi', prefix: 'taxi_pergi' },
              { id: 'taxi_pulang', prefix: 'taxi_pulang' },
              { id: 'biaya_tol', prefix: 'tol' },
              { id: 'representatif', prefix: 'representatif' },
            ];

            for (const type of types) {
              pelaksanaPromises.push(
                getFile(`sppd_${type.prefix}_${data.noSppd}_${p.nip}`)
                  .then(f => f ? { id: type.id, value: 'Terunggah' } : null)
                  .catch(() => null)
              );
            }
          }
        }

        const results = await Promise.all([...promises, ...pelaksanaPromises]);
        
        for (const res of results) {
          if (res && res.id) {
            if (!newUploadedFiles[res.id]) {
              newUploadedFiles[res.id] = res.value;
            }
          }
        }
        
        setUploadedFiles(newUploadedFiles);
      };
      
      checkFiles();
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const isDalamDaerah = data?.tipePerjalanan === 'Dalam Daerah' || data?.jenis_perjalanan === 'Dalam Daerah';

  const baseDocuments = isDalamDaerah ? [
    { name: "Kuitansi Dinas", icon: Receipt, docId: "kwitansi" },
    { name: "Rincian Perjalanan", icon: BarChart2, docId: "rincian" },
    { name: "Laporan Perjalanan Dinas", icon: ClipboardList, docId: "laporan" },
    { name: "SPPD", icon: BadgeCheck, docId: "sppd" },
    { name: "Dokumentasi", icon: ClipboardList, docId: "dokumentasi" },
    { name: "Bukti Biaya Transportasi", icon: Car, docId: "transportasi" },
    { name: "Bukti Biaya Penginapan", icon: Bed, docId: "penginapan" }
  ] : [
    { name: "Kwitansi Perjalanan Dinas", icon: Receipt, docId: "kwitansi" },
    { name: "Rincian Perjalanan Dinas", icon: BarChart2, docId: "rincian" },
    { name: "Laporan Perjalanan Dinas", icon: ClipboardList, docId: "laporan" },
    { name: "SPPD Visum", icon: BadgeCheck, docId: "sppd" },
    { name: "Dokumentasi", icon: ClipboardList, docId: "dokumentasi" },
    { name: "Bill Hotel", icon: Bed, docId: "penginapan" },
    { name: "Sewa Kendaraan", icon: Car, docId: "transportasi" },
    { name: "Tiket Pesawat (Pergi)", icon: Car, docId: "pesawat_pergi" },
    { name: "Tiket Pesawat (Pulang)", icon: Car, docId: "pesawat_pulang" },
    { name: "Tiket Kereta Api", icon: Car, docId: "kereta_api" },
    { name: "Biaya Tol", icon: Car, docId: "biaya_tol" },
    { name: "Taxi Bandara (Pergi)", icon: Car, docId: "taxi_pergi" },
    { name: "Taxi Bandara (Pulang)", icon: Car, docId: "taxi_pulang" },
    { name: "Biaya Representatif", icon: Wallet, docId: "representatif" }
  ];

  const documents = buktiPembayaran 
    ? [...baseDocuments, { name: "Bukti Pembayaran / Pindah Buku", icon: Wallet, docId: "bukti_pembayaran" }]
    : baseDocuments;

  const getGolongan = (nama: string, p: any) => {
    if (p.golongan || p.pangkatGolongan || p.pangkat) return p.golongan || p.pangkatGolongan || p.pangkat;
    const n = nama.toLowerCase();
    if (n.includes("hasnawati")) return "Penata Tk. I / III.d";
    if (n.includes("masitah")) return "Penata Tingkat I / IIId";
    if (n.includes("rahmawati")) return "Penata Muda Tk. I / III.b";
    if (n.includes("trimo")) return "Pengatur Muda/Iia";
    if (n.includes("devi") || n.includes("fadli")) return "-";
    return "Penata / IIIc";
  };

  const handleViewDoc = async (docId: string, docName: string, nip?: string) => {
    if (!data) return;
    let key = "";
    if (docId === 'laporan') {
      const exists = await getFile(`sppd_laporan_${data.noSppd}`);
      key = exists ? `sppd_laporan_${data.noSppd}` : `draft_laporan_${data.noSppd}`;
    }
    else if (docId === 'dokumentasi') {
      const exists = await getFile(`sppd_dokumentasi_${data.noSppd}`);
      key = exists ? `sppd_dokumentasi_${data.noSppd}` : `draft_dokumentasi_${data.noSppd}`;
    }
    else if (docId === 'kwitansi') key = `sppd_kwitansi_${data.noSppd}`;
    else if (docId === 'rincian') key = `sppd_rincian_${data.noSppd}`;
    else if (docId === 'sppd') key = `sppd_tervisum_${data.noSppd}`;
    else if (docId === 'bukti_pembayaran') key = `sppd_bukti_pembayaran_${data.noSppd}`;
    else if (['penginapan', 'transportasi', 'pesawat_pergi', 'pesawat_pulang', 'kereta_api', 'taxi_pergi', 'taxi_pulang', 'biaya_tol', 'representatif'].includes(docId)) {
      let filePrefix = '';
      if (docId === 'penginapan') filePrefix = 'hotel';
      else if (docId === 'transportasi') filePrefix = 'kendaraan';
      else if (docId === 'pesawat_pergi') filePrefix = 'pesawat_pergi';
      else if (docId === 'pesawat_pulang') filePrefix = 'pesawat_pulang';
      else if (docId === 'kereta_api') filePrefix = 'kereta';
      else if (docId === 'taxi_pergi') filePrefix = 'taxi_pergi';
      else if (docId === 'taxi_pulang') filePrefix = 'taxi_pulang';
      else if (docId === 'biaya_tol') filePrefix = 'tol';
      else if (docId === 'representatif') filePrefix = 'representatif';
      
      const keys = data.pelaksana.map((p: any) => `sppd_${filePrefix}_${data.noSppd}_${p.nip}`);
      try {
        toast.info(`Menggabungkan file ${docName}...`);
        key = await mergePdfs(keys, `temp_${docId}_${data.noSppd.replace(/\//g, '_')}`);
      } catch (err) {
        toast.error(`Tidak ada file ${docName} yang dapat digabungkan`);
        return;
      }
    }
    else {
        toast.info(`Dokumen ${docName} tidak ditemukan.`);
        return;
    }
    
    setPreviewFileKey(key);
    setPreviewTitle(docName);
    setIsPreviewOpen(true);
  };

  const handleUploadFile = async (docId: string, file: File) => {
    let key = "";
    if (docId === 'kwitansi') key = `sppd_kwitansi_${data.noSppd}`;
    else if (docId === 'rincian') key = `sppd_rincian_${data.noSppd}`;
    else if (docId === 'sppd') key = `sppd_tervisum_${data.noSppd}`;
    else if (docId === 'laporan') key = `sppd_laporan_${data.noSppd}`;
    else if (docId === 'dokumentasi') key = `sppd_dokumentasi_${data.noSppd}`;
    
    if (key) {
      try {
        await saveFile(key, file);
        
        // Apabila ini kwitansi atau rincian, aplikasikan ulang barcode untuk yang sudah setuju
        if (docId === 'kwitansi' || docId === 'rincian' || docId === 'laporan') {
          toast.info("Mengaplikasikan ulang barcode persetujuan (jika ada)...");
          await reapplyBarcodes(docId, data);
        }
        
        setUploadedFiles(prev => ({ ...prev, [docId]: file.name }));
        toast.success(`${file.name} berhasil diunggah dan diperbarui dengan barcode`);
      } catch (err) {
        toast.error("Gagal mengunggah file");
      }
    }
  };

  const handleDownloadRincian = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const travelersList = (data.pelaksana || []).map((p: any) => ({
      nama: p.nama,
      nip: p.nip,
      pangkatGolongan: getGolongan(p.nama, p),
      jumlahHari: p.jumlahHari || data.lamaHari || 3,
      uangHarianPerHari: 170000,
      totalUangHarian: p.totalUangHarian || ((p.jumlahHari || data.lamaHari || 3) * 170000),
      totalBiayaHotel: p.totalBiayaHotel || 0,
      totalSewaKendaraan: p.totalSewaKendaraan || 0,
    }));
    const maxHari = Math.max(...travelersList.map((t: any) => t.jumlahHari));
    const effectiveLamaHari = maxHari > 0 ? maxHari : (data.lamaHari || 3);
    const startDate = data.tanggalMulai ? new Date(data.tanggalMulai) : new Date();
    const endDate = data.tanggalSelesai ? new Date(data.tanggalSelesai) : new Date();
    const header: any = {
      kota: data.kota || 'BERAU',
      lamaHari: effectiveLamaHari,
      tanggalMulai: startDate,
      tanggalSelesai: endDate,
      tanggalDokumen: new Date(),
      noSppdList: travelersList.map((_: any, i: number) => {
        let rawNoSppd = data.noSppd || "-";
        if (rawNoSppd.includes("SPPD-V2/2026")) rawNoSppd = rawNoSppd.replace("SPPD-V2/2026", "DKPP-KUMKM.3 / SPD");
        if (rawNoSppd === "-") return "-";
        const parts = rawNoSppd.split('/');
        if (parts.length < 2) return rawNoSppd;
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) return rawNoSppd;
        return `${parts[0]}/${String(num + i).padStart(parts[1].length, '0')}/${parts.slice(2).join('/')}`;
      }),
    };
    header.kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };
    header.bendahara = { nama: 'Wenry Adeputra, S.E.', nip: '19910627 202321 1 019', pangkatGolongan: '- / IX' };
    exportRincianDalamDaerah(header, travelersList)
      .then(() => toast.success("File Rincian Excel berhasil diunduh"))
      .catch((err) => { toast.error('Gagal mengunduh Excel'); });
  };

  const handleDownloadKwitansi = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const travelersList = (data.pelaksana || []).map((p: any) => ({
      nama: p.nama,
      nip: p.nip,
      pangkatGolongan: getGolongan(p.nama, p),
      jumlahHari: p.jumlahHari || data.lamaHari || 3,
      uangHarianPerHari: 170000,
      totalUangHarian: p.totalUangHarian || ((p.jumlahHari || data.lamaHari || 3) * 170000),
      totalBiayaHotel: p.totalBiayaHotel || 0,
      totalSewaKendaraan: p.totalSewaKendaraan || 0,
    }));
    const header: any = {
      kota: data.kota || 'BERAU',
      tanggalDokumen: new Date(),
      program: data.program || 'Program Pengembangan Koperasi',
      kegiatan: data.kegiatan || 'Pengawasan dan Pemeriksaan Koperasi',
      subKegiatan: data.subKegiatan || '2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi',
      maksud: data.maksud || '',
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai,
      noSppdList: travelersList.map((_: any, i: number) => {
        let rawNoSppd = data.noSppd || "-";
        if (rawNoSppd.includes("SPPD-V2/2026")) rawNoSppd = rawNoSppd.replace("SPPD-V2/2026", "DKPP-KUMKM.3 / SPD");
        if (rawNoSppd === "-") return "-";
        const parts = rawNoSppd.split('/');
        if (parts.length < 2) return rawNoSppd;
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) return rawNoSppd;
        return `${parts[0]}/${String(num + i).padStart(parts[1].length, '0')}/${parts.slice(2).join('/')}`;
      }),
    };
    header.kpa = { nama: 'Wahid Hasyim', nip: '198202082005021002', pangkatGolongan: 'Penata Tk. I / III.d' };
    header.bendahara = { nama: 'Wenry Adeputra, S.E.', nip: '19910627 202321 1 019', pangkatGolongan: '- / IX' };
    let pptk = { nama: 'Rahmawati', nip: '199511302022032030', pangkatGolongan: 'Penata Muda / III.a' };
    header.pptk = pptk;
      exportKwitansiDalamDaerah(header, travelersList)
      .then(() => toast.success("File Kwitansi Excel berhasil diunduh"))
      .catch((err) => { toast.error('Gagal mengunduh Kwitansi Excel'); });
  };

  const isEditable = ['belum_spj', 'draft_laporan', 'perbaikan'].includes(data.status || 'belum_spj');

  const visibleDocuments = documents.filter(doc => {
    if (isDalamDaerah) return true;
    if (uploadedFiles[doc.docId]) return true;
    if (!isEditable) return false;
    const canUploadHere = ['kwitansi', 'rincian', 'sppd', 'bukti_pembayaran'].includes(doc.docId);
    return canUploadHere;
  });

  return (
    <>
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#00475e] text-white flex justify-between items-start sm:items-center shrink-0">
            <div className="flex-1 pr-4">
              <h2 className="text-base sm:text-lg font-bold">Lampiran Dokumen Laporan (SPJ)</h2>
              <p className="text-[10px] sm:text-xs text-blue-100 mt-1 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <User className="w-3.5 h-3.5" />
                  Pembuat: <span className="font-semibold text-white">{typeof data.pembuat === 'string' ? data.pembuat : data.pembuat?.nama || 'Pengelola'}</span>
                </span>
                <span className="hidden sm:inline mx-1 opacity-50">|</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FileText className="w-3.5 h-3.5 sm:ml-1" />
                  No. SPPD: <span className="font-semibold text-white">{data.noSppd || data.no_sppd || '-'}</span>
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {/* Dokumen Kelengkapan */}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Kelengkapan Dokumen</h3>
            <div className="space-y-3 mb-6">
              {visibleDocuments.map((doc, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 sm:mt-0">
                      <doc.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-700 break-words">{doc.name}</h4>
                      {uploadedFiles[doc.docId] ? (
                        <p className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5 flex items-start sm:items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 sm:mt-0" /> 
                          <span className="break-all">Sudah diunggah ({uploadedFiles[doc.docId]})</span>
                        </p>
                      ) : (
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Belum diunggah</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col min-[480px]:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {uploadedFiles[doc.docId] && (
                      <button 
                        onClick={() => handleViewDoc(doc.docId, doc.name)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold">Lihat</span>
                      </button>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[doc.docId] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFile(doc.docId, file);
                      }}
                      className="hidden"
                    />
                    {['kwitansi', 'rincian', 'sppd', 'bukti_pembayaran'].includes(doc.docId) && isEditable && (
                      <button 
                        onClick={() => fileInputRefs.current[doc.docId]?.click()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors border border-slate-300"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-bold">{uploadedFiles[doc.docId] ? 'Ganti File' : 'Unggah'}</span>
                      </button>
                    )}
                    {doc.docId === 'rincian' && (
                      <button
                        onClick={handleDownloadRincian}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#e6f4f1] hover:bg-[#d0ece5] text-[#00475e] rounded-lg transition-colors border border-[#00475e]/20"
                      >
                        <FileDown className="w-4 h-4" />
                        <span className="text-xs font-bold">Unduh</span>
                      </button>
                    )}
                    {doc.docId === 'kwitansi' && (
                      <button
                        onClick={handleDownloadKwitansi}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#e6f4f1] hover:bg-[#d0ece5] text-[#00475e] rounded-lg transition-colors border border-[#00475e]/20"
                      >
                        <FileDown className="w-4 h-4" />
                        <span className="text-xs font-bold">Unduh</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={`${data.status === "selesai" ? "bg-emerald-50 border-emerald-200" : "bg-blue-100/50 border-blue-100"} border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-2`}>
              <div>
                <p className="text-xs font-bold text-[#475569] mb-1">Total Anggaran SPJ</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1e293b]">Rp {(data.totalAnggaran !== undefined && data.totalAnggaran !== null ? data.totalAnggaran : 3450000).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-[#475569]/20 pt-3 sm:pt-0">
                <p className="text-xs font-bold text-[#475569] mb-1">Status Anggaran</p>
                <p className={`text-sm font-bold ${data.status === "selesai" ? "text-emerald-700" : "text-[#1e3a8a]"}`}>
                  {data.status === "selesai" ? "DIBAYAR LUNAS" : "BELUM DIBAYAR LUNAS"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between gap-3">
            <div className="w-full sm:w-auto">
              {onSubmitUlang && ['draft_laporan', 'perbaikan'].includes(data.status) && (
                <div className="flex flex-col min-[480px]:flex-row gap-2 w-full">
                  <button
                    onClick={() => {
                      onSubmitUlang('menunggu_verifikasi_pegawai');
                      onClose();
                    }}
                    className="w-full min-[480px]:w-auto px-6 py-2.5 rounded text-sm font-bold text-white bg-[#00475e] hover:bg-[#1a5f7a] transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {data.status === 'perbaikan' ? 'Submit Ulang' : 'Submit Laporan'}
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Yakin ingin mereset/menghapus semua file lampiran untuk SPPD ini? Gunakan ini jika terdapat file dari data lama yang masih muncul.')) {
                        await deleteFilesContaining(data.noSppd);
                        setUploadedFiles({});
                        toast.success('Semua file lampiran berhasil direset');
                      }
                    }}
                    className="w-full min-[480px]:w-auto px-6 py-2.5 rounded text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Reset Lampiran (Data Nyangkut)
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end w-full sm:w-auto flex-1">
              {footerActions ? footerActions : (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Kembali
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    
    <KwitansiPreviewModal
      isOpen={isKwitansiPreviewOpen}
      onClose={() => setIsKwitansiPreviewOpen(false)}
      data={data}
    />
    <RincianPreviewModal
      isOpen={isRincianPreviewOpen}
      onClose={() => setIsRincianPreviewOpen(false)}
      data={data}
    />
    <FilePreviewModal
      isOpen={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
      fileKey={previewFileKey}
      title={previewTitle}
    />
    </>
  );
}
