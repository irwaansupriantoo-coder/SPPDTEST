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
        for (const item of keysToCheck) {
          try {
            let file = await getFile(item.key);
            if (!file && (item.id === 'laporan' || item.id === 'dokumentasi')) {
              file = await get(`draft_${item.id}_${data.noSppd}`);
            }
            if (file) {
              newUploadedFiles[item.id] = file instanceof File ? file.name : 'Terunggah';
            } else if (item.id === 'bukti_pembayaran' && bp) {
              newUploadedFiles[item.id] = bp;
            }
          } catch (e) {
            if (item.id === 'bukti_pembayaran' && bp) {
              newUploadedFiles[item.id] = bp;
            }
          }
        }

        if (data.pelaksana && Array.isArray(data.pelaksana)) {
          let foundFiles: Record<string, boolean> = {};
          for (const p of data.pelaksana) {
            try {
              if (!foundFiles['penginapan']) {
                const f = await getFile(`sppd_hotel_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['penginapan'] = true; newUploadedFiles['penginapan'] = 'Terunggah'; }
              }
              if (!foundFiles['transportasi']) {
                const f = await getFile(`sppd_kendaraan_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['transportasi'] = true; newUploadedFiles['transportasi'] = 'Terunggah'; }
              }
              if (!foundFiles['pesawat_pergi']) {
                const f = await getFile(`sppd_pesawat_pergi_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['pesawat_pergi'] = true; newUploadedFiles['pesawat_pergi'] = 'Terunggah'; }
              }
              if (!foundFiles['pesawat_pulang']) {
                const f = await getFile(`sppd_pesawat_pulang_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['pesawat_pulang'] = true; newUploadedFiles['pesawat_pulang'] = 'Terunggah'; }
              }
              if (!foundFiles['kereta_api']) {
                const f = await getFile(`sppd_kereta_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['kereta_api'] = true; newUploadedFiles['kereta_api'] = 'Terunggah'; }
              }
              if (!foundFiles['taxi_pergi']) {
                const f = await getFile(`sppd_taxi_pergi_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['taxi_pergi'] = true; newUploadedFiles['taxi_pergi'] = 'Terunggah'; }
              }
              if (!foundFiles['taxi_pulang']) {
                const f = await getFile(`sppd_taxi_pulang_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['taxi_pulang'] = true; newUploadedFiles['taxi_pulang'] = 'Terunggah'; }
              }
              if (!foundFiles['biaya_tol']) {
                const f = await getFile(`sppd_tol_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['biaya_tol'] = true; newUploadedFiles['biaya_tol'] = 'Terunggah'; }
              }
              if (!foundFiles['representatif']) {
                const f = await getFile(`sppd_representatif_${data.noSppd}_${p.nip}`);
                if (f) { foundFiles['representatif'] = true; newUploadedFiles['representatif'] = 'Terunggah'; }
              }
              
              const travelerData = await get(`draft_traveler_data_${data.noSppd}`);
              if (travelerData && travelerData[p.nip]) {
                const td = travelerData[p.nip];
                if (!newUploadedFiles['kwitansi'] && td.kwitansiFile) {
                  await saveFile(`sppd_kwitansi_${data.noSppd}`, td.kwitansiFile);
                  newUploadedFiles['kwitansi'] = 'Terunggah';
                }
                if (!newUploadedFiles['rincian'] && td.rincianFile) {
                  await saveFile(`sppd_rincian_${data.noSppd}`, td.rincianFile);
                  newUploadedFiles['rincian'] = 'Terunggah';
                }
                if (!newUploadedFiles['pesawat_pergi'] && td.pesawat?.filePergi) {
                  await saveFile(`sppd_pesawat_pergi_${data.noSppd}_${p.nip}`, td.pesawat.filePergi);
                  newUploadedFiles['pesawat_pergi'] = 'Terunggah';
                }
                if (!newUploadedFiles['pesawat_pulang'] && td.pesawat?.filePulang) {
                  await saveFile(`sppd_pesawat_pulang_${data.noSppd}_${p.nip}`, td.pesawat.filePulang);
                  newUploadedFiles['pesawat_pulang'] = 'Terunggah';
                }
                if (!newUploadedFiles['kereta_api'] && td.keretaApi?.file) {
                  await saveFile(`sppd_kereta_${data.noSppd}_${p.nip}`, td.keretaApi.file);
                  newUploadedFiles['kereta_api'] = 'Terunggah';
                }
                if (!newUploadedFiles['taxi_pergi'] && td.taxiBandara?.filePergi) {
                  await saveFile(`sppd_taxi_pergi_${data.noSppd}_${p.nip}`, td.taxiBandara.filePergi);
                  newUploadedFiles['taxi_pergi'] = 'Terunggah';
                }
                if (!newUploadedFiles['taxi_pulang'] && td.taxiBandara?.filePulang) {
                  await saveFile(`sppd_taxi_pulang_${data.noSppd}_${p.nip}`, td.taxiBandara.filePulang);
                  newUploadedFiles['taxi_pulang'] = 'Terunggah';
                }
                if (!newUploadedFiles['biaya_tol'] && td.biayaTol?.file) {
                  await saveFile(`sppd_tol_${data.noSppd}_${p.nip}`, td.biayaTol.file);
                  newUploadedFiles['biaya_tol'] = 'Terunggah';
                }
                if (!newUploadedFiles['representatif'] && td.biayaRepresentatif?.file) {
                  await saveFile(`sppd_representatif_${data.noSppd}_${p.nip}`, td.biayaRepresentatif.file);
                  newUploadedFiles['representatif'] = 'Terunggah';
                }
                if (!newUploadedFiles['penginapan'] && td.hotelFile) {
                  await saveFile(`sppd_hotel_${data.noSppd}_${p.nip}`, td.hotelFile);
                  newUploadedFiles['penginapan'] = 'Terunggah';
                }
                if (!newUploadedFiles['transportasi'] && td.sewaKendaraan?.file) {
                  await saveFile(`sppd_kendaraan_${data.noSppd}_${p.nip}`, td.sewaKendaraan.file);
                  newUploadedFiles['transportasi'] = 'Terunggah';
                }
                if (!newUploadedFiles['sppd'] && td.sppdVisumFile) {
                  await saveFile(`sppd_tervisum_${data.noSppd}`, td.sppdVisumFile);
                  newUploadedFiles['sppd'] = 'Terunggah';
                }
              }
            } catch(e) {}
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
          <div className="px-6 py-4 bg-[#00475e] text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-lg font-bold">Lampiran Dokumen Laporan (SPJ)</h2>
              <p className="text-xs text-blue-100 mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Pembuat Laporan: <span className="font-semibold text-white">{typeof data.pembuat === 'string' ? data.pembuat : data.pembuat?.nama || 'Pengelola'}</span>
                <span className="mx-2 opacity-50">|</span>
                <FileText className="w-3.5 h-3.5 ml-1" />
                No. SPPD: <span className="font-semibold text-white">{data.noSppd || data.no_sppd || '-'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <doc.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700">{doc.name}</h4>
                      {uploadedFiles[doc.docId] ? (
                        <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sudah diunggah ({uploadedFiles[doc.docId]})
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Belum diunggah</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
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
            <div className={`${data.status === "selesai" ? "bg-emerald-50 border-emerald-200" : "bg-blue-100/50 border-blue-100"} border rounded-xl p-5 flex items-center justify-between`}>
              <div>
                <p className="text-xs font-bold text-[#475569] mb-1">Total Anggaran SPJ</p>
                <p className="text-2xl font-bold text-[#1e293b]">Rp {(data.totalAnggaran !== undefined && data.totalAnggaran !== null ? data.totalAnggaran : 3450000).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#475569] mb-1">Status Anggaran</p>
                <p className={`text-sm font-bold ${data.status === "selesai" ? "text-emerald-700" : "text-[#1e3a8a]"}`}>
                  {data.status === "selesai" ? "DIBAYAR LUNAS" : "BELUM DIBAYAR LUNAS"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
            <div>
              {onSubmitUlang && ['draft_laporan', 'perbaikan'].includes(data.status) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSubmitUlang('menunggu_verifikasi_pegawai');
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded text-sm font-bold text-white bg-[#00475e] hover:bg-[#1a5f7a] transition-colors flex items-center gap-2"
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
                    className="px-6 py-2.5 rounded text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    Reset Lampiran (Data Nyangkut)
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end flex-1">
              {footerActions ? footerActions : (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
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
