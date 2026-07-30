import React, { useState, useRef, useEffect } from "react";
import { apiRequest } from "../utils/supabaseClient";
import { createPengajuan } from "../utils/supabaseDataStore";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { ReviewModal } from "../components/ReviewModal";
import { PrintableSPPD } from "../components/PrintableSPPD";
import { CustomSelect } from "../components/CustomSelect";
import {
  Upload,
  CloudUpload,
  CheckCircle,
  MapPin,
  Plane,
  Car,
  Ship,
  Info,
  Calendar,
  ShieldCheck,
  Eye,
  Lock,
  Users,
  X,
  FileText,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { processFileForOCR, SptData } from "../utils/sptParser";
import { saveFileToDB } from "../utils/db";
import { getSubKegiatanByPengelola, buildProgramData, loadSubKegiatanData } from "../utils/anggaranStore";
import { logActivity } from "../utils/activityStore";
import { setProgramData as saveProgramDataToStore } from "../utils/supabaseDataStore";

const PROGRAM_DATA: Record<string, Record<string, string[]>> = {
  "Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)": {
    "Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan": [
      "2.17.07.2.01.04.5.1.02.04.01.0003 - Sub Kegiatan Pemberdayaan Kelembagaan Potensi dan Pengembangan Usaha Mikro",
      "2.17.07.2.01.04.5.1.02.04.01.0004 - Sub Kegiatan Pendataan Potensi Usaha Mikro"
    ],
    "Pengembangan Usaha Mikro melalui Fasilitasi, Bimbingan Teknis, dan Pendampingan": [
      "2.17.07.2.01.04.5.1.02.04.01.0005 - Sub Kegiatan Fasilitasi Akses Permodalan",
      "2.17.07.2.01.04.5.1.02.04.01.0006 - Sub Kegiatan Pelatihan dan Bimbingan Teknis"
    ]
  },
  "Program Pengembangan Koperasi": {
    "Peningkatan Kualitas SDM Koperasi": [
      "2.17.07.2.01.04.5.1.02.04.01.0007 - Pelatihan Manajemen Koperasi"
    ],
    "Pengawasan dan Pemeriksaan Koperasi": [
      "2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi"
    ]
  }
};

interface PelaksanaData {
  nama: string;
  nip: string;
  pangkat: string;
  jabatan: string;
  alatAngkut: string;
  selected: boolean;
  locked: boolean;
}

import { AVAILABLE_PEGAWAI } from "../utils/pegawai";
import { useAuth } from "../context/AuthContext";

const BERAU_DISTRICTS = [
  "tanjung redeb",
  "sambaliung",
  "gunung tabur",
  "teluk bayur",
  "batu putih",
  "biatan",
  "biduk-biduk",
  "kelay",
  "maratua",
  "pulau derawan",
  "segah",
  "tabalar",
  "talisayan",
];

export default function Pengajuan() {
  const { user } = useAuth();
  const [tipePerjalanan, setTipePerjalanan] =
    useState("Luar Daerah");
  const [alatAngkut, setAlatAngkut] = useState(
    "Transportasi Darat",
  );
  const [sptUploaded, setSptUploaded] = useState(false);
  const [sptFileName, setSptFileName] = useState("");
  const [sptFileUrl, setSptFileUrl] = useState("");
  const [dasarSuratUploaded, setDasarSuratUploaded] =
    useState(false);
  const [dasarSuratFileName, setDasarSuratFileName] =
    useState("");
  const [dasarSuratFileUrl, setDasarSuratFileUrl] =
    useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] =
    useState(false);
  const [selectedPegawaiIndex, setSelectedPegawaiIndex] =
    useState<string>("");
  const [filePreviewModal, setFilePreviewModal] = useState<{
    isOpen: boolean;
    fileName: string;
    fileUrl: string;
  }>({
    isOpen: false,
    fileName: "",
    fileUrl: "",
  });

  const sptInputRef = useRef<HTMLInputElement>(null);
  const dasarSuratInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    noSpt: "",
    tanggalSpt: "",
    tempatBerangkat: "",
    tempatTujuan: "",
    tanggalPergi: "",
    tanggalKembali: "",
    keperluan: "",
    program: "",
    kegiatan: "",
    subKegiatan: "",
  });

  const [pelaksanaList, setPelaksanaList] = useState<
    PelaksanaData[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [programData, setProgramData] = useState<Record<string, Record<string, string[]>>>({});

  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!user) return;
      setIsLoadingPrograms(true);
      try {
        const pengelolaNip = user?.nip || "19970610 202521 1 001";
        // Ensure data is loaded from Supabase first
        await loadSubKegiatanData();
        
        const assigned = getSubKegiatanByPengelola(pengelolaNip);
        if (assigned.length > 0) {
          setProgramData(buildProgramData(assigned));
        } else {
          setProgramData({});
        }
      } catch (err) {
        console.error("Failed to load programs", err);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [user]);

  // Extract data with OCR
  const handleSptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSptFileName(file.name);
    
    try {
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      setSptFileUrl(base64Url);
    } catch (e) {
      console.error("Failed to read file", e);
    }

    // We create a custom toast to show progress
    const toastId = toast.loading("Memulai proses OCR...");

    try {
      const data = await processFileForOCR(file, (msg) => {
        toast.loading(msg, { id: toastId });
      });

      toast.success(
        "File SPT berhasil diunggah dan diekstrak. Silakan periksa kembali isian formulir.",
        { id: toastId }
      );

      setSptUploaded(true);

      // Update form data
      setFormData(prev => ({
        ...prev,
        noSpt: data.no_spt || prev.noSpt,
        tanggalSpt: data.tanggal_spt || prev.tanggalSpt,
        tempatBerangkat: data.tempat_berangkat || prev.tempatBerangkat,
        tempatTujuan: data.tempat_tujuan || prev.tempatTujuan,
        tanggalPergi: data.tanggal_berangkat || prev.tanggalPergi,
        tanggalKembali: data.tanggal_kembali || prev.tanggalKembali,
        keperluan: data.keperluan || prev.keperluan
      }));

      // Set Tipe Perjalanan based on destination
      if (data.tempat_tujuan) {
        const tujuanLower = data.tempat_tujuan.toLowerCase();
        const dalamKata = [
          'berau', 'gunung tabur', 'teluk bayur', 'tanjung redeb',
          'sambaliung', 'kelay', 'segah', 'biduk', 'pulau derawan', 'maratua'
        ];
        const isDalam = dalamKata.some(k => tujuanLower.includes(k));
        setTipePerjalanan(isDalam ? 'Dalam Daerah' : 'Luar Daerah');
      }

      // Add pelaku to the list if found
      if (data.pelaku && data.pelaku.length > 0) {
        // We will keep only unique based on NIP
        const newPelaksanaList = [...pelaksanaList];

        data.pelaku.forEach(p => {
          if (!newPelaksanaList.some(ext => ext.nip === p.nip)) {
            newPelaksanaList.push({
              nama: p.nama,
              nip: p.nip,
              pangkat: p.pangkat,
              jabatan: p.jabatan,
              alatAngkut: "Transportasi Darat",
              selected: true,
              locked: false,
            });
          }
        });

        setPelaksanaList(newPelaksanaList);
      }

    } catch (err: any) {
      toast.error(`Gagal mengekstrak teks: ${err.message}`, { id: toastId });
      // Provide fallback
      setSptUploaded(true);
    }
  };

  const handleAddPelaksana = () => {
    if (!selectedPegawaiIndex) {
      toast.error("Pilih pegawai terlebih dahulu");
      return;
    }

    const pegawai =
      AVAILABLE_PEGAWAI[parseInt(selectedPegawaiIndex)];

    // Check if already added
    if (pelaksanaList.some((p) => p.nip === pegawai.nip)) {
      toast.error("Pegawai sudah ditambahkan");
      return;
    }

    const newPelaksana: PelaksanaData = {
      nama: pegawai.nama,
      nip: pegawai.nip,
      pangkat: pegawai.pangkat,
      jabatan: pegawai.jabatan,
      alatAngkut: "Transportasi Darat",
      selected: true,
      locked: true,
    };

    setPelaksanaList([...pelaksanaList, newPelaksana]);
    setSelectedPegawaiIndex("");
    toast.success(
      `${pegawai.nama} ditambahkan ke daftar pelaksana`,
    );
  };

  const handleRemovePelaksana = (nip: string) => {
    setPelaksanaList(
      pelaksanaList.filter((p) => p.nip !== nip),
    );
    toast.success("Pelaksana dihapus dari daftar");
  };

  const handleDasarSuratUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setDasarSuratFileName(file.name);
      
      try {
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        setDasarSuratFileUrl(base64Url);
      } catch (e) {
        console.error("Failed to read file", e);
      }
      
      setDasarSuratUploaded(true);
      toast.success("Dasar Surat berhasil diunggah.");
    }
  };

  const handleReviewClick = () => {
    const selectedPelaksana = pelaksanaList.filter(
      (p) => p.selected,
    );
    if (selectedPelaksana.length === 0) {
      toast.error("Pilih minimal satu pelaksana perjalanan");
      return;
    }
    setIsReviewModalOpen(true);
  };

  const getSelectedPelaksana = () => {
    return pelaksanaList.filter((p) => p.selected);
  };

  const calculateBudget = () => {
    if (!formData.tanggalPergi || !formData.tanggalKembali)
      return 0;
    const start = new Date(formData.tanggalPergi);
    const end = new Date(formData.tanggalKembali);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days =
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate =
      tipePerjalanan === "Luar Daerah" ? 430000 : 170000;
    const selectedCount = pelaksanaList.filter(
      (p) => p.selected,
    ).length;
    return dailyRate * days * selectedCount;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitPengajuan = async () => {
    if (isSubmitting) return;

    // Validate form
    if (!formData.tempatBerangkat || !formData.tempatTujuan ||
      !formData.tanggalPergi || !formData.tanggalKembali ||
      !formData.keperluan || !formData.program || !formData.kegiatan || !formData.subKegiatan) {
      toast.error("Mohon lengkapi semua data form pengajuan");
      return;
    }

    if (pelaksanaList.length === 0) {
      toast.error("Harap tambahkan minimal 1 pelaksana perjalanan dinas!");
      return;
    }

    if (!sptUploaded || !dasarSuratUploaded) {
      toast.error("Mohon upload semua dokumen yang diperlukan (SPT dan Dasar Surat)");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Memproses pengajuan...", { id: "submit-pengajuan" });

    // Generate SPT and SPPD numbers if not parsed
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    let nextId = 1;
    try {
      const existingReq: any = await apiRequest('/pengajuan');
      const extData = existingReq.data || existingReq;
      if (Array.isArray(extData)) {
        let maxId = 0;
        extData.forEach((req: any) => {
          if (req.noSppd) {
            const parts = req.noSppd.split('/');
            if (parts.length > 1) {
              const num = parseInt(parts[1], 10);
              if (!isNaN(num)) {
                const count = Array.isArray(req.pelaksana) ? req.pelaksana.length : 1;
                const reqMax = num + count - 1;
                if (reqMax > maxId) {
                  maxId = reqMax;
                }
              }
            }
          }
        });
        nextId = maxId > 0 ? maxId + 1 : 1;
      }
    } catch (e) {}

    const random = Math.floor(Math.random() * 1000);
    const noSpt = formData.noSpt || `090/${month}${random}/SPT-I/${year}`;
    const paddedId = String(nextId).padStart(5, '0');
    const noSppd = `094/${paddedId}/SPPD-V2/${year}`;

    // Calculate total budget
    const totalAnggaran = calculateBudget();

    const payload = {
      noSpt,
      noSppd,
      pembuat: {
        nama: user?.nama || "Pengelola",
        nip: user?.nip || "-"
      },
      pelaksana: pelaksanaList.map(p => ({
        nama: p.nama,
        nip: p.nip,
        pangkat: p.pangkat?.replace(/^\/?\s*Gol\s*:\s*/i, '') || '-',
        jabatan: p.jabatan || '-',
        statusLaporan: "belum_lengkap",
      })),
      kota: formData.tempatTujuan,
      totalAnggaran,
      tipePerjalanan: tipePerjalanan as "Dalam Daerah" | "Luar Daerah",
      tempatBerangkat: formData.tempatBerangkat,
      tanggalPergi: formData.tanggalPergi,
      tanggalKembali: formData.tanggalKembali,
      keperluan: formData.keperluan,
      program: formData.program,
      kegiatan: formData.kegiatan,
      subKegiatan: formData.subKegiatan,
      alatAngkut,
      statusPengajuan: "Menunggu Persetujuan",
      sptFileUrl,
      dasarSuratFileUrl,
    };

    try {
      // 1. Simpan file dokumen (SPT & Dasar Surat) ke Supabase Storage DULUAN.
      // Agar jika gagal (misal karena RLS error), pengajuan tidak telanjur terbuat di database (mencegah duplikat).
      if (sptFileUrl) {
        await saveFileToDB(`spt_${noSppd}`, sptFileUrl);
      }
      if (dasarSuratFileUrl) {
        await saveFileToDB(`dasar_${noSppd}`, dasarSuratFileUrl);
      }

      // 2. Simpan data text pengajuan langsung ke Supabase Database
      await createPengajuan(payload);
      
      // 3. Update anggaran
      try {
        const currentAnggaran: any = await apiRequest('/anggaran');
        const targetAnggaran = tipePerjalanan === "Dalam Daerah" ? currentAnggaran.dalamDaerah : currentAnggaran.luarDaerah;
        await apiRequest('/anggaran', {
          method: 'PUT',
          body: JSON.stringify({
            type: tipePerjalanan,
            total: targetAnggaran.total,
            used: (targetAnggaran.used || 0) + totalAnggaran,
            tahun: new Date().getFullYear().toString()
          })
        }).catch(e => console.warn("Expected 500 on PUT /anggaran ignored:", e));
      } catch (angErr) {
        console.error("Failed to update anggaran:", angErr);
      }
      
      // Simpan tanggal dan program data ke Supabase
      saveProgramDataToStore(
        noSppd,
        {
          program: formData.program,
          kegiatan: formData.kegiatan,
          subKegiatan: formData.subKegiatan,
          keperluan: formData.keperluan
        },
        {
          tanggalPergi: formData.tanggalPergi,
          tanggalKembali: formData.tanggalKembali
        }
      );

      setIsReviewModalOpen(false);
      
      logActivity(
        'pengajuan_sppd',
        `Pengajuan ${noSppd} Baru`,
        `Dibuat oleh ${user?.nama || "Pengelola"}`,
        noSppd
      );

      toast.success("Pengajuan berhasil disimpan! Mengarahkan ke halaman Daftar Pengajuan...", {
        id: "submit-pengajuan",
        duration: 1500,
      });

      setTimeout(() => {
        window.location.href = '/daftar-pengajuan';
      }, 1500);
    } catch (err: any) {
      toast.error(`Gagal menyimpan pengajuan: ${err.message}`, { id: "submit-pengajuan" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />

      <main className="ml-64 pt-24 pb-16 px-8">
        <div>
          {/* Page Header */}
          <header className="mb-10">
            <h2 className="text-4xl font-bold tracking-tight text-[#00475e] mb-1">
              Form Pengajuan Perjalanan Dinas
            </h2>
            <p className="text-[#40484d]">
              Lengkapi berkas dan detail operasional untuk
              penerbitan SPPD.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Form Area */}
            <div className="lg:col-span-8 space-y-10">
              {/* Section 1: Upload SPT */}
              <section className="bg-white p-8 rounded-xl border border-slate-200/10 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#00475e] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    1
                  </span>
                  <h3 className="text-xl font-bold text-[#00475e]">
                    Upload Surat Perintah Tugas (SPT)
                  </h3>
                </div>
                <input
                  ref={sptInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleSptUpload}
                  className="hidden"
                />
                <div
                  onClick={() => sptInputRef.current?.click()}
                  className="border-2 border-dashed border-[#c0c8cd] rounded-xl p-10 flex flex-col items-center justify-center text-center bg-[#f2f4f6]/30 hover:bg-[#f2f4f6] transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform border border-slate-200">
                    <Upload className="w-8 h-8 text-[#00475e]" />
                  </div>
                  <p className="text-[#191c1e] font-semibold">
                    Klik untuk upload atau drag berkas SPT
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Format PDF (Maks. 5MB). Data akan diekstrak
                    otomatis.
                  </p>
                </div>
                {sptUploaded && (
                  <div className="mt-4 flex items-center justify-between px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {sptFileName} berhasil diunggah.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setFilePreviewModal({
                            isOpen: true,
                            fileName: sptFileName,
                            fileUrl: sptFileUrl,
                          })
                        }
                        className="p-1.5 hover:bg-green-100 rounded-md transition-colors text-green-700"
                        title="Lihat Dokumen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSptUploaded(false);
                          setSptFileName("");
                          setSptFileUrl("");
                          if (sptInputRef.current)
                            sptInputRef.current.value = "";
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-md transition-colors text-red-600"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Section 2: Upload Dasar Surat */}
              <section className="bg-white p-8 rounded-xl border border-slate-200/10 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#00475e] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    2
                  </span>
                  <h3 className="text-xl font-bold text-[#00475e]">
                    Dasar Surat (Surat Undangan / Telaahan Staf)
                  </h3>
                </div>
                <input
                  ref={dasarSuratInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDasarSuratUpload}
                  className="hidden"
                />
                <div
                  onClick={() =>
                    dasarSuratInputRef.current?.click()
                  }
                  className="border-2 border-dashed border-[#c0c8cd] rounded-xl p-10 flex flex-col items-center justify-center text-center bg-[#f2f4f6]/30 hover:bg-[#f2f4f6] transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform border border-slate-200">
                    <CloudUpload className="w-8 h-8 text-[#00475e]" />
                  </div>
                  <p className="text-[#191c1e] font-semibold">
                    Klik untuk upload atau drag berkas Dasar
                    Surat
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Format PDF, JPG, atau PNG (Maks. 5MB).
                  </p>
                </div>
                {dasarSuratUploaded && (
                  <div className="mt-4 flex items-center justify-between px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {dasarSuratFileName} berhasil diunggah.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setFilePreviewModal({
                            isOpen: true,
                            fileName: dasarSuratFileName,
                            fileUrl: dasarSuratFileUrl,
                          })
                        }
                        className="p-1.5 hover:bg-green-100 rounded-md transition-colors text-green-700"
                        title="Lihat Dokumen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDasarSuratUploaded(false);
                          setDasarSuratFileName("");
                          setDasarSuratFileUrl("");
                          if (dasarSuratInputRef.current)
                            dasarSuratInputRef.current.value =
                              "";
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-md transition-colors text-red-600"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Section 3: Data Detail */}
              <section className="bg-white p-8 rounded-xl border border-slate-200/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-8 h-8 rounded-full bg-[#00475e] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    3
                  </span>
                  <h3 className="text-xl font-bold text-[#00475e]">
                    Detail Perjalanan & Pelaksana
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type Selection */}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                      Tipe Perjalanan
                    </label>
                    <div className="flex gap-4">
                      <label className="flex-1 cursor-pointer group">
                        <input
                          type="radio"
                          name="tipe"
                          checked={
                            tipePerjalanan === "Dalam Daerah"
                          }
                          onChange={() =>
                            setTipePerjalanan("Dalam Daerah")
                          }
                          className="peer hidden"
                        />
                        <div
                          className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm
                          ${tipePerjalanan === "Dalam Daerah" ? "bg-[#00475e] text-white border-[#00475e]" : "border-[#c0c8cd]/30 hover:border-[#00475e]"}`}
                        >
                          <MapPin className="w-5 h-5" />
                          <span className="font-bold text-sm">
                            Dalam Daerah
                          </span>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer group">
                        <input
                          type="radio"
                          name="tipe"
                          checked={
                            tipePerjalanan === "Luar Daerah"
                          }
                          onChange={() =>
                            setTipePerjalanan("Luar Daerah")
                          }
                          className="peer hidden"
                        />
                        <div
                          className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm
                          ${tipePerjalanan === "Luar Daerah" ? "bg-[#00475e] text-white border-[#00475e]" : "border-[#c0c8cd]/30 hover:border-[#00475e]"}`}
                        >
                          <Plane className="w-5 h-5" />
                          <span className="font-bold text-sm">
                            Luar Daerah
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="col-span-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Tempat Berangkat
                    </label>
                    <input
                      type="text"
                      value={formData.tempatBerangkat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempatBerangkat: e.target.value,
                        })
                      }
                      className="w-full bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none"
                      placeholder="Silahkan isikan data"
                    />
                  </div>
                  <div className="col-span-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Tempat Tujuan
                    </label>
                    <input
                      type="text"
                      value={formData.tempatTujuan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempatTujuan: e.target.value,
                        })
                      }
                      className="w-full bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none"
                      placeholder="Silahkan isikan data"
                    />
                  </div>

                  <div className="col-span-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Tanggal Pergi
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.tanggalPergi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tanggalPergi: e.target.value,
                          })
                        }
                        className={`w-full bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none ${!formData.tanggalPergi ? "text-slate-400" : "text-[#191c1e]"}`}
                        onFocus={(e) =>
                          e.target.classList.remove(
                            "text-slate-400",
                          )
                        }
                        onBlur={(e) =>
                          !formData.tanggalPergi &&
                          e.target.classList.add(
                            "text-slate-400",
                          )
                        }
                      />
                      {/* {!formData.tanggalPergi && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                          Pilih Tanggal
                        </span>
                      )} */}
                    </div>
                  </div>
                  <div className="col-span-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Tanggal Kembali
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.tanggalKembali}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tanggalKembali: e.target.value,
                          })
                        }
                        className={`w-full bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none ${!formData.tanggalKembali ? "text-slate-400" : "text-[#191c1e]"}`}
                        onFocus={(e) =>
                          e.target.classList.remove(
                            "text-slate-400",
                          )
                        }
                        onBlur={(e) =>
                          !formData.tanggalKembali &&
                          e.target.classList.add(
                            "text-slate-400",
                          )
                        }
                      />
                      {/* {!formData.tanggalKembali && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                          Pilih Tanggal
                        </span>
                      )} */}
                    </div>
                  </div>

                  {/* Alat Angkut */}
                  <div className="col-span-2 relative mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                      Alat Angkut
                    </label>
                    <div className="flex gap-4">
                      {['Transportasi Darat', 'Pesawat Udara', 'Transportasi Laut'].map((mode) => (
                        <label key={mode} className="flex-1 cursor-pointer group">
                          <input
                            type="radio"
                            name="alatAngkut"
                            checked={alatAngkut === mode}
                            onChange={() => setAlatAngkut(mode)}
                            className="peer hidden"
                          />
                          <div
                            className={`p-4 border rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm
                            ${alatAngkut === mode ? "bg-[#00475e] text-white border-[#00475e]" : "border-[#c0c8cd]/30 hover:border-[#00475e]"}`}
                          >
                            {mode === 'Transportasi Darat' && <Car className="w-5 h-5" />}
                            {mode === 'Pesawat Udara' && <Plane className="w-5 h-5" />}
                            {mode === 'Transportasi Laut' && <Ship className="w-5 h-5" />}
                            <span className="font-bold text-sm">
                              {mode}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Keperluan Perjalanan
                    </label>
                    <textarea
                      value={formData.keperluan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          keperluan: e.target.value,
                        })
                      }
                      className="w-full bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none"
                      rows={3}
                      placeholder="Silahkan isi maksud dan tujuan perjalanan dinas"
                    />
                  </div>

                  {isLoadingPrograms ? (
                    <div className="col-span-2 mt-4 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-medium flex items-center gap-2">
                      <div className="w-5 h-5 flex-shrink-0 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"></div>
                      Memuat data program & sub kegiatan...
                    </div>
                  ) : Object.keys(programData).length === 0 ? (
                    <div className="col-span-2 mt-4 p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      Anda belum memiliki Sub Kegiatan yang ditugaskan oleh PPTK. Silakan hubungi PPTK Anda.
                    </div>
                  ) : (
                    <>
                      {/* Program */}
                      <div className="col-span-2 mt-2">
                        <CustomSelect
                          label="Program"
                          value={formData.program}
                          placeholder="-- Pilih Program --"
                          options={Object.keys(programData)}
                          onChange={(val) => {
                            setFormData({
                              ...formData,
                              program: val,
                              kegiatan: "",
                              subKegiatan: "",
                            });
                          }}
                        />
                      </div>

                      {/* Kegiatan */}
                      {formData.program && (
                        <div className="col-span-2 mt-2">
                          <CustomSelect
                            label="Kegiatan"
                            value={formData.kegiatan}
                            placeholder="-- Pilih Kegiatan --"
                            options={Object.keys(programData[formData.program] || {})}
                            onChange={(val) => {
                              setFormData({
                                ...formData,
                                kegiatan: val,
                                subKegiatan: "",
                              });
                            }}
                          />
                        </div>
                      )}

                      {/* Sub Kegiatan */}
                      {formData.program && formData.kegiatan && (
                        <div className="col-span-2 mt-2">
                          <CustomSelect
                            label="Sub Kegiatan"
                            value={formData.subKegiatan}
                            placeholder="-- Pilih Sub Kegiatan --"
                            options={programData[formData.program]?.[formData.kegiatan] || []}
                            onChange={(val) => {
                              setFormData({
                                ...formData,
                                subKegiatan: val,
                              });
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Pilih Pelaksana */}
                  <div className="col-span-2 mt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                      Daftar Pelaksana Perjalanan
                    </label>

                    {/* Dropdown untuk memilih pegawai */}
                    <div className="flex gap-3 mb-4">
                      <select
                        value={selectedPegawaiIndex}
                        onChange={(e) =>
                          setSelectedPegawaiIndex(
                            e.target.value,
                          )
                        }
                        className="flex-1 bg-[#f2f4f6] border border-[#c0c8cd]/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-white transition-all outline-none"
                      >
                        <option value="">
                          -- Pilih Pegawai --
                        </option>
                        {AVAILABLE_PEGAWAI.map(
                          (pegawai, index) => (
                            <option key={index} value={index}>
                              {pegawai.nama} - NIP:{" "}
                              {pegawai.nip}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        onClick={handleAddPelaksana}
                        className="px-6 py-3 bg-[#00475e] text-white rounded-lg font-bold text-sm hover:bg-[#1a5f7a] transition-all hover:shadow-md active:scale-95 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Tambah
                      </button>
                    </div>

                    {/* List pelaksana yang sudah dipilih */}
                    {pelaksanaList.length > 0 ? (
                      <div className="space-y-3">
                        {pelaksanaList.map(
                          (pelaksana, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white border border-[#c0c8cd]/40 rounded-xl shadow-sm relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#00475e]"></div>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-[#191c1e] text-sm">
                                      {pelaksana.nama}
                                    </h4>
                                    {pelaksana.locked && (
                                      <Lock className="w-4 h-4 text-[#00475e]" />
                                    )}
                                  </div>
                                  <p className="text-slate-600 text-xs mt-1">
                                    NIP: {pelaksana.nip}
                                  </p>
                                  <p className="text-slate-600 text-xs mt-1">
                                    Pangkat/Gol:{" "}
                                    {pelaksana.pangkat?.replace(/^\/?\s*Gol\s*:\s*/i, '') || '-'}
                                  </p>
                                  <p className="text-slate-500 text-xs mt-1 font-medium">
                                    {pelaksana.jabatan || '-'}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemovePelaksana(
                                      pelaksana.nip,
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-[#f2f4f6] border border-[#c0c8cd]/30 border-dashed rounded-xl text-center">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-medium">
                          Belum ada pelaksana yang dipilih
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Alat Angkut */}
                  <div className="col-span-2 mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                      Alat Angkut
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="cursor-pointer group">
                        <input
                          type="radio"
                          name="alat_angkut"
                          checked={
                            alatAngkut === "Transportasi Darat"
                          }
                          onChange={() =>
                            setAlatAngkut("Transportasi Darat")
                          }
                          className="peer hidden"
                        />
                        <div className="px-4 py-3 border border-[#c0c8cd]/30 rounded-lg flex items-center justify-center gap-2 group-hover:border-[#00475e] peer-checked:bg-[#1a5f7a] peer-checked:text-white peer-checked:border-[#00475e] transition-all text-xs font-bold hover:shadow-md">
                          <Car className="w-5 h-5" />
                          Transportasi Darat
                        </div>
                      </label>
                      <label className="cursor-pointer group">
                        <input
                          type="radio"
                          name="alat_angkut"
                          checked={
                            alatAngkut === "Pesawat Udara"
                          }
                          onChange={() =>
                            setAlatAngkut("Pesawat Udara")
                          }
                          className="peer hidden"
                        />
                        <div className="px-4 py-3 border border-[#c0c8cd]/30 rounded-lg flex items-center justify-center gap-2 group-hover:border-[#00475e] peer-checked:bg-[#1a5f7a] peer-checked:text-white peer-checked:border-[#00475e] transition-all text-xs font-bold hover:shadow-md">
                          <Plane className="w-5 h-5" />
                          Pesawat Udara
                        </div>
                      </label>
                      <label className="cursor-pointer group">
                        <input
                          type="radio"
                          name="alat_angkut"
                          checked={
                            alatAngkut === "Transportasi Laut"
                          }
                          onChange={() =>
                            setAlatAngkut("Transportasi Laut")
                          }
                          className="peer hidden"
                        />
                        <div className="px-4 py-3 border border-[#c0c8cd]/30 rounded-lg flex items-center justify-center gap-2 group-hover:border-[#00475e] peer-checked:bg-[#1a5f7a] peer-checked:text-white peer-checked:border-[#00475e] transition-all text-xs font-bold hover:shadow-md">
                          <Ship className="w-5 h-5" />
                          Transportasi Laut
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Finalisasi */}
              <section className="bg-white p-8 rounded-xl border border-slate-200/10 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-[#00475e] text-white flex items-center justify-center text-xs font-bold shadow-md">
                    4
                  </span>
                  <h3 className="text-xl font-bold text-[#00475e]">
                    Konfirmasi Akhir
                  </h3>
                </div>
                <div className="bg-gradient-to-b from-[#f2f4f6]/50 to-[#f2f4f6] p-10 rounded-xl flex flex-col items-center justify-center text-center border border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <ShieldCheck className="w-10 h-10 text-[#00475e]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#191c1e] mb-2">
                    Siap untuk Mengajukan?
                  </h4>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Pastikan seluruh data yang diisi telah
                    sesuai dengan Surat Perintah Tugas (SPT).
                    Anda dapat meninjau draf dokumen SPPD
                    sebelum menyimpan pengajuan.
                  </p>
                  <button
                    onClick={handleReviewClick}
                    disabled={pelaksanaList.length === 0}
                    className={`px-8 py-3.5 font-bold rounded-xl transition-all flex items-center gap-2 mb-2 ${pelaksanaList.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#00475e] text-white hover:bg-[#1a5f7a] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"}`}
                  >
                    <Eye className="w-5 h-5" />
                    Review Draft SPPD
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium mt-2">
                    Dokumen draft akan ditampilkan dalam bentuk
                    visual sesuai standar formal.
                  </p>
                </div>
              </section>
            </div>

            {/* Right: Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-24">
                <section className="bg-gradient-to-br from-[#00475e] to-[#1a5f7a] p-8 rounded-xl text-white shadow-xl shadow-[#00475e]/10 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                    Ringkasan Pengajuan
                  </h3>

                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                          Jenis Perjalanan
                        </p>
                        <p className="text-sm font-semibold">
                          {tipePerjalanan}
                        </p>
                      </div>
                      <MapPin className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                        Tujuan
                      </p>
                      <p className="text-sm font-semibold">
                        {formData.tempatTujuan || "-"}
                      </p>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                          Durasi
                        </p>
                        <p className="text-sm font-semibold">
                          {formData.tanggalPergi &&
                            formData.tanggalKembali
                            ? (() => {
                              const start = new Date(
                                formData.tanggalPergi,
                              );
                              const end = new Date(
                                formData.tanggalKembali,
                              );
                              const diffTime = Math.abs(
                                end.getTime() -
                                start.getTime(),
                              );
                              const diffDays =
                                Math.ceil(
                                  diffTime /
                                  (1000 * 60 * 60 * 24),
                                ) + 1;
                              const startMonth = [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "Mei",
                                "Jun",
                                "Jul",
                                "Agu",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Des",
                              ][start.getMonth()];
                              return `${diffDays} Hari (${start.getDate()}-${end.getDate()} ${startMonth})`;
                            })()
                            : "-"}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-white/40" />
                    </div>

                    <div className="pt-5 border-t border-white/10 mt-5">
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider mb-3">
                        Pelaksana Perjalanan
                      </p>
                      {pelaksanaList.length > 0 ? (
                        <div className="space-y-3">
                          {pelaksanaList.map((p, i) => (
                            <div
                              key={i}
                              className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/5"
                            >
                              <p className="text-xs font-bold leading-tight">
                                {p.nama}
                              </p>
                              <p className="text-[10px] text-white/80 mt-0.5">
                                {p.nip}
                              </p>
                              <div className="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-white/10">
                                <p className="text-[9px] text-white/70">
                                  Pangkat / Gol : {p.pangkat?.replace(/^\/?\s*Gol\s*:\s*/i, '') || '-'}
                                </p>
                                <p className="text-[9px] font-medium text-white/90">
                                  {p.jabatan}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/50 italic">
                          Belum ada pelaksana
                        </p>
                      )}
                    </div>

                    <div className="pt-5 border-t border-white/10 mt-5">
                      <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider mb-1">
                        Total Anggaran Uang Harian
                      </p>
                      <p className="text-3xl font-bold">
                        Rp{" "}
                        {calculateBudget().toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p className="text-[9px] text-white/50 mt-2 italic font-medium">
                        *Berdasarkan SBU Th. 2024
                      </p>
                    </div>
                  </div>
                </section>

                {/* Budget Status */}
                <section className="mt-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-[#4c616d]" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Status Anggaran
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full mb-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-[#00475e] h-full rounded-full transition-all duration-1000"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-[#4c616d] leading-relaxed font-medium">
                    65% Pagu Anggaran Program UMKM telah
                    terealisasi.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onPrint={handlePrint}
        onSubmit={handleSubmitPengajuan}
        isSubmitting={isSubmitting}
        data={{
          keperluan: formData.keperluan,
          tempatBerangkat: formData.tempatBerangkat,
          tempatTujuan: formData.tempatTujuan,
          tanggalPergi: formData.tanggalPergi,
          tanggalKembali: formData.tanggalKembali,
          tipePerjalanan: tipePerjalanan,
          alatAngkut: alatAngkut,
          pelaksana: getSelectedPelaksana(),
        }}
      />

      {/* Printable SPPD (hidden, for printing only) */}
      <PrintableSPPD
        data={{
          keperluan: formData.keperluan,
          tempatBerangkat: formData.tempatBerangkat,
          tempatTujuan: formData.tempatTujuan,
          tanggalPergi: formData.tanggalPergi,
          tanggalKembali: formData.tanggalKembali,
          tipePerjalanan: tipePerjalanan,
          alatAngkut: alatAngkut,
          pelaksana: getSelectedPelaksana(),
        }}
      />

      {/* File Preview Modal */}
      {filePreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191c1e]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#00475e]" />
                <h3 className="font-bold text-[#191c1e]">
                  {filePreviewModal.fileName}
                </h3>
              </div>
              <button
                onClick={() =>
                  setFilePreviewModal({
                    isOpen: false,
                    fileName: "",
                    fileUrl: "",
                  })
                }
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-auto min-h-[500px]">
              <div className="text-center text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-lg">
                  Preview Dokumen Tidak Tersedia
                </p>
                <p className="text-sm mt-1">
                  Sistem saat ini menggunakan mode simulasi
                  untuk file upload.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() =>
                  setFilePreviewModal({
                    isOpen: false,
                    fileName: "",
                    fileUrl: "",
                  })
                }
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
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