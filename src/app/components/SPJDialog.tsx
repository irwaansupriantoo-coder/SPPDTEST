import React, { useState, useRef } from 'react';
import { X, User, DollarSign, Hotel, Car, Upload, CheckCircle, Ship, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { saveFile } from '../utils/fileStore';
import { exportRincianDalamDaerah } from '../utils/exportExcelDalamDaerah';
import { exportKwitansiDalamDaerah } from '../utils/exportKwitansiDalamDaerah';

interface Pelaksana {
  nama: string;
  nip: string;
}

interface SPJDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (travelerData: any) => void;
  data: {
    noSpt: string;
    noSppd: string;
    pelaksana: Pelaksana[];
    tipePerjalanan: string;
    lamaHari?: number;
    kota?: string;
    tanggalMulai?: Date;
    tanggalSelesai?: Date;
  };
}

interface TravelerData {
  jumlahHari: string;
  standardUangHarian: string;
  totalUangHarian: number;
  standardBiayaHotel: string;
  jumlahMalam: number;
  totalBiayaHotel: number;
  tidakSewaKamar: boolean;
  tidakSewaKendaraan: boolean;
  jenisTransportasi: 'darat' | 'laut';
  sewaKendaraan: string;
  jenisSewaKendaraan: 'pergi' | 'pulang-pergi';
  totalSewaKendaraan: number;
  deskripsiLaporan: string;
  uploadedFiles: {
    hotel: File | null;
    kendaraan: File | null;
  };
}

export function SPJDialog({ isOpen, onClose, onSave, data }: SPJDialogProps) {
  const [travelerData, setTravelerData] = useState<{ [key: string]: TravelerData }>(
    data.pelaksana.reduce((acc, p) => ({
      ...acc,
      [p.nip]: {
        jumlahHari: (data.lamaHari || 3).toString(),
        standardUangHarian: '170000',
        totalUangHarian: (data.lamaHari || 3) * 170000,
        standardBiayaHotel: '',
        jumlahMalam: Math.max(0, (data.lamaHari || 3) - 1),
        totalBiayaHotel: 0,
        tidakSewaKamar: false,
        tidakSewaKendaraan: false,
        jenisTransportasi: 'darat',
        sewaKendaraan: '',
        jenisSewaKendaraan: 'pergi',
        totalSewaKendaraan: 0,
        uploadedFiles: {
          hotel: null,
          kendaraan: null
        }
      }
    }), {})
  );

  const hotelFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const kendaraanFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [dokumentasiFile, setDokumentasiFile] = useState<File | null>(null);
  const [laporanFile, setLaporanFile] = useState<File | null>(null);
  const [dokumentasiUrl, setDokumentasiUrl] = useState<string>("");
  const [laporanUrl, setLaporanUrl] = useState<string>("");
  const dokumentasiRef = useRef<HTMLInputElement | null>(null);
  const laporanRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (data?.noSppd) {
      const loadServerFiles = async () => {
        try {
          const { getSupabaseClient } = await import('../utils/supabaseClient');
          const sb = getSupabaseClient();
          
          const dokKey = `sppd_dokumentasi_${data.noSppd}`;
          const { data: dokUrl } = await sb.storage.from('sppd-documents').createSignedUrl(dokKey, 3600);
          if (dokUrl?.signedUrl) setDokumentasiUrl(dokUrl.signedUrl);
          
          const lapKey = `sppd_laporan_${data.noSppd}`;
          const { data: lapUrl } = await sb.storage.from('sppd-documents').createSignedUrl(lapKey, 3600);
          if (lapUrl?.signedUrl) setLaporanUrl(lapUrl.signedUrl);
        } catch (e) {
          console.error("Failed to load server files", e);
        }
      };
      loadServerFiles();
    }
  }, [data?.noSppd]);

  if (!isOpen) return null;

  const handleInputChange = (nip: string, field: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const currentData = travelerData[nip];

    let updatedData = { ...currentData, [field]: numericValue };

    // Auto-calculate totals for uang harian (always locked at 170,000)
    if (field === 'jumlahHari') {
      const hari = parseInt(numericValue || '0');
      const standard = 170000; // Locked value
      updatedData.totalUangHarian = hari * standard;
      updatedData.standardUangHarian = '170000'; // Keep locked
      
      // Calculate jumlah malam (hari - 1)
      updatedData.jumlahMalam = Math.max(0, hari - 1);
      
      // Recalculate hotel based on nights
      if (!currentData.tidakSewaKamar) {
        const standardHotel = parseInt(currentData.standardBiayaHotel || '0');
        updatedData.totalBiayaHotel = updatedData.jumlahMalam * standardHotel;
      }
    }

    if (field === 'standardBiayaHotel' && !currentData.tidakSewaKamar) {
      const malam = currentData.jumlahMalam;
      const standard = parseInt(numericValue || '0');
      updatedData.totalBiayaHotel = malam * standard;
    }

    if (field === 'sewaKendaraan' && !currentData.tidakSewaKendaraan) {
      const sewa = parseInt(numericValue || '0');
      const multiplier = currentData.jenisSewaKendaraan === 'pulang-pergi' ? 2 : 1;
      updatedData.totalSewaKendaraan = sewa * multiplier;
    }

    setTravelerData(prev => ({
      ...prev,
      [nip]: updatedData
    }));
  };

  const handleTidakSewaKamarChange = (nip: string, checked: boolean) => {
    const currentData = travelerData[nip];
    setTravelerData(prev => ({
      ...prev,
      [nip]: {
        ...prev[nip],
        tidakSewaKamar: checked,
        standardBiayaHotel: checked ? '0' : prev[nip].standardBiayaHotel,
        totalBiayaHotel: 0
      }
    }));
  };

  const handleTidakSewaKendaraanChange = (nip: string, checked: boolean) => {
    setTravelerData(prev => ({
      ...prev,
      [nip]: {
        ...prev[nip],
        tidakSewaKendaraan: checked,
        sewaKendaraan: checked ? '0' : prev[nip].sewaKendaraan,
        totalSewaKendaraan: 0
      }
    }));
  };

  const handleJenisTransportasiChange = (nip: string, jenis: 'darat' | 'laut') => {
    setTravelerData(prev => ({
      ...prev,
      [nip]: {
        ...prev[nip],
        jenisTransportasi: jenis
      }
    }));
  };

  const handleJenisSewaChange = (nip: string, jenis: 'pergi' | 'pulang-pergi') => {
    const currentData = travelerData[nip];
    const sewa = parseInt(currentData.sewaKendaraan || '0');
    const multiplier = jenis === 'pulang-pergi' ? 2 : 1;

    setTravelerData(prev => ({
      ...prev,
      [nip]: {
        ...prev[nip],
        jenisSewaKendaraan: jenis,
        totalSewaKendaraan: sewa * multiplier
      }
    }));
  };

  const handleFileUpload = (nip: string, type: 'hotel' | 'kendaraan', file: File | null) => {
    if (file) {
      setTravelerData(prev => ({
        ...prev,
        [nip]: {
          ...prev[nip],
          uploadedFiles: {
            ...prev[nip].uploadedFiles,
            [type]: file
          }
        }
      }));
      toast.success(`${file.name} berhasil diunggah`);
    }
  };



  const formatCurrency = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString('id-ID');
  };

  const calculateSubtotal = (nip: string) => {
    const data = travelerData[nip];
    return data.totalUangHarian + data.totalBiayaHotel + data.totalSewaKendaraan;
  };

  const calculateGrandTotal = () => {
    return Object.keys(travelerData).reduce((sum, nip) => sum + calculateSubtotal(nip), 0);
  };

  const handleSave = async () => {
    // Validate that at least one field is filled
    const hasData = Object.values(travelerData).some(td =>
      td.jumlahHari || td.standardUangHarian || td.standardBiayaHotel || td.sewaKendaraan
    );

    if (!hasData) {
      toast.error('Mohon isi minimal satu field biaya');
      return;
    }

    toast.info('Menyimpan laporan beserta file dokumen...');
    try {
      // Upload files to Supabase Storage
      if (dokumentasiFile) await saveFile(`sppd_dokumentasi_${data.noSppd}`, dokumentasiFile);
      if (laporanFile) await saveFile(`sppd_laporan_${data.noSppd}`, laporanFile);

      for (const [nip, td] of Object.entries(travelerData)) {
        if (td.uploadedFiles.hotel) await saveFile(`sppd_hotel_${data.noSppd}_${nip}`, td.uploadedFiles.hotel);
        if (td.uploadedFiles.kendaraan) await saveFile(`sppd_kendaraan_${data.noSppd}_${nip}`, td.uploadedFiles.kendaraan);
      }

      toast.success('Laporan realisasi berhasil disimpan ke server.');
      onSave(travelerData);
      onClose();
    } catch (error) {
      console.error('Failed to save files', error);
      toast.error('Gagal mengunggah file dokumen ke server.');
    }
  };

  const getGolongan = (nama: string, p: any) => {
    if (p.golongan || p.pangkatGolongan || p.pangkat) return p.golongan || p.pangkatGolongan || p.pangkat;
    const n = nama.toLowerCase();
    if (n.includes("hasnawati")) return "Pembina / IVa";
    if (n.includes("masitah")) return "Penata Tingkat I / IIId";
    if (n.includes("rahmawati")) return "Penata Muda Tk. I / III.b";
    if (n.includes("trimo")) return "Pengatur Muda/Iia";
    if (n.includes("devi") || n.includes("fadli")) return "-";
    return "Penata / IIIc"; // Default fallback
  };

  const handleExportRincian = () => {
    const travelersList = data.pelaksana.map(p => {
      const tData = travelerData[p.nip];
      return {
        nama: p.nama,
        nip: p.nip,
        pangkatGolongan: getGolongan(p.nama, p),
        jumlahHari: parseInt(tData?.jumlahHari || '0'),
        uangHarianPerHari: parseInt(tData?.standardUangHarian || '170000'),
        totalUangHarian: tData?.totalUangHarian || 0,
        totalBiayaHotel: tData?.totalBiayaHotel || 0,
        totalSewaKendaraan: tData?.totalSewaKendaraan || 0,
      };
    });

    const maxHari = Math.max(...travelersList.map(t => t.jumlahHari));
    const effectiveLamaHari = maxHari > 0 ? maxHari : (data.lamaHari || 3);
    
    const startDate = data.tanggalMulai ? new Date(data.tanggalMulai) : new Date();
    const endDate = data.tanggalSelesai ? new Date(data.tanggalSelesai) : new Date();

    const header = {
      kota: data.kota || 'BERAU',
      lamaHari: effectiveLamaHari,
      tanggalMulai: startDate,
      tanggalSelesai: endDate,
      tanggalDokumen: new Date(),
      noSppdList: travelersList.map((_, i) => {
        if (!data.noSppd) return "-";
        const parts = data.noSppd.split('/');
        if (parts.length < 2) return data.noSppd;
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) return data.noSppd;
        return `${parts[0]}/${String(num + i).padStart(parts[1].length, '0')}/${parts.slice(2).join('/')}`;
      }),
    };

    exportRincianDalamDaerah(header, travelersList).catch(err => {
      console.error('Export failed', err);
      toast.error('Gagal mengunduh Excel');
    });
  };

  const handleExportKwitansi = () => {
    const travelersList = data.pelaksana.map(p => {
      const tData = travelerData[p.nip];
      return {
        nama: p.nama,
        nip: p.nip,
        pangkatGolongan: getGolongan(p.nama, p),
        jumlahHari: parseInt(tData?.jumlahHari || '0'),
        uangHarianPerHari: parseInt(tData?.standardUangHarian || '170000'),
        totalUangHarian: tData?.totalUangHarian || 0,
        totalBiayaHotel: tData?.totalBiayaHotel || 0,
        totalSewaKendaraan: tData?.totalSewaKendaraan || 0,
      };
    });

    const header = {
      kota: data.kota || 'BERAU',
      tanggalDokumen: new Date(),
      program: 'Program Pengembangan Koperasi',
      kegiatan: 'Pengawasan dan Pemeriksaan Koperasi',
      subKegiatan: '2.17.07.2.01.04.5.1.02.04.01.0008 - Pemeriksaan Kelembagaan Koperasi',
      maksud: '',
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai,
      noSppdList: travelersList.map((_, i) => {
        if (!data.noSppd) return "-";
        const parts = data.noSppd.split('/');
        if (parts.length < 2) return data.noSppd;
        const num = parseInt(parts[1], 10);
        if (isNaN(num)) return data.noSppd;
        return `${parts[0]}/${String(num + i).padStart(parts[1].length, '0')}/${parts.slice(2).join('/')}`;
      }),
    };

    exportKwitansiDalamDaerah(header, travelersList).catch(err => {
      console.error('Export failed', err);
      toast.error('Gagal mengunduh Kwitansi Excel');
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#191c1e]/40 backdrop-blur-md" onClick={onClose}></div>

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200/20 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-[#00475e] to-[#1a5f7a] text-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Input Realisasi Biaya - Dalam Daerah</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  {data.noSpt}
                </span>
                <p className="text-white/80 text-xs font-medium border-l border-white/20 pl-3">
                  Input detail biaya per pelaksana.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-0 overflow-y-auto flex-1 hide-scrollbar">
          <div className="space-y-0">
            {data.pelaksana.map((pelaksana, index) => (
              <div key={pelaksana.nip} className="border-b border-slate-200/50">
                {/* Traveler Header */}
                <div className="bg-[#f2f4f6] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00475e]/10 flex items-center justify-center text-[#00475e]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#191c1e]">
                        {index + 1}. {pelaksana.nama}
                      </h3>
                      <p className="text-[10px] text-slate-600 font-medium">
                        NIP: {pelaksana.nip}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                      Subtotal Realisasi
                    </p>
                    <p className="text-sm font-black text-[#00475e]">
                      Rp {calculateSubtotal(pelaksana.nip).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Traveler Form Fields */}
                <div className="p-8 space-y-6">
                  {/* Jumlah Hari */}
                  <div className="pb-6 border-b border-slate-200">
                    <label className="text-xs font-bold text-[#191c1e] block mb-2">
                      Jumlah Hari Perjalanan Dinas
                    </label>
                    <input
                      type="text"
                      value={travelerData[pelaksana.nip]?.jumlahHari || ''}
                      disabled
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed transition-all outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Masukkan jumlah hari sesuai dengan durasi perjalanan
                    </p>
                    {travelerData[pelaksana.nip]?.jumlahHari && (
                      <p className="text-[10px] text-[#00475e] mt-1 font-semibold">
                        Jumlah Malam: {travelerData[pelaksana.nip].jumlahMalam} malam
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Uang Harian */}
                    <div className="lg:col-span-4 flex flex-col">
                      <div className="mb-3">
                        <label className="text-xs font-bold text-[#191c1e] flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Uang Harian
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Rp 170.000 × jumlah hari
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                            Rp
                          </span>
                          <input
                            type="text"
                            value="170.000"
                            disabled
                            className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed"
                          />
                        </div>
                        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Total</p>
                          <p className="text-sm font-black text-green-900">
                            Rp {travelerData[pelaksana.nip]?.totalUangHarian.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Biaya Hotel */}
                    <div className="lg:col-span-4 flex flex-col">
                      <div className="mb-3">
                        <label className="text-xs font-bold text-[#191c1e] flex items-center gap-2">
                          <Hotel className="w-4 h-4" />
                          Biaya Hotel
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Standar biaya × jumlah malam
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`tidak-sewa-kamar-${pelaksana.nip}`}
                            checked={travelerData[pelaksana.nip]?.tidakSewaKamar || false}
                            onChange={(e) => handleTidakSewaKamarChange(pelaksana.nip, e.target.checked)}
                            className="w-4 h-4 text-[#00475e] border-slate-300 rounded focus:ring-[#00475e]"
                          />
                          <label htmlFor={`tidak-sewa-kamar-${pelaksana.nip}`} className="text-[10px] font-bold text-slate-600">
                            Tidak sewa kamar
                          </label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={travelerData[pelaksana.nip]?.standardBiayaHotel ? formatCurrency(travelerData[pelaksana.nip].standardBiayaHotel) : ''}
                            onChange={(e) => handleInputChange(pelaksana.nip, 'standardBiayaHotel', e.target.value)}
                            disabled={travelerData[pelaksana.nip]?.tidakSewaKamar}
                            className={`w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00475e]/20 text-sm font-bold transition-all outline-none ${
                              travelerData[pelaksana.nip]?.tidakSewaKamar 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-[#f2f4f6] text-[#191c1e]'
                            }`}
                            placeholder="Standar biaya"
                          />
                        </div>
                        <input
                          ref={(el) => { hotelFileRefs.current[pelaksana.nip] = el; }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(pelaksana.nip, 'hotel', e.target.files?.[0] || null)}
                          className="hidden"
                          disabled={travelerData[pelaksana.nip]?.tidakSewaKamar}
                        />
                        <button
                          onClick={() => hotelFileRefs.current[pelaksana.nip]?.click()}
                          disabled={travelerData[pelaksana.nip]?.tidakSewaKamar}
                          className={`w-full flex items-center justify-center gap-2 border-2 border-dashed p-2 rounded-xl transition-all group ${
                            travelerData[pelaksana.nip]?.tidakSewaKamar
                              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                              : 'border-slate-300 hover:border-[#00475e]/50 bg-white hover:bg-[#00475e]/5'
                          }`}
                        >
                          {travelerData[pelaksana.nip]?.uploadedFiles.hotel ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-[10px] font-bold text-green-600 tracking-tight truncate max-w-[150px]">
                                {travelerData[pelaksana.nip].uploadedFiles.hotel?.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-500 group-hover:text-[#00475e]" />
                              <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#00475e] tracking-tight">
                                Upload Bill Hotel
                              </span>
                            </>
                          )}
                        </button>
                        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Total</p>
                          <p className="text-sm font-black text-green-900">
                            Rp {travelerData[pelaksana.nip]?.totalBiayaHotel.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sewa Kendaraan */}
                    <div className="lg:col-span-4 flex flex-col">
                      <div className="mb-3">
                        <label className="text-xs font-bold text-[#191c1e] flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Sewa Kendaraan
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Pilih jenis transportasi
                        </p>
                      </div>
                      <div className="space-y-2">
                        {/* Checkbox tidak sewa kendaraan */}
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`tidak-sewa-kendaraan-${pelaksana.nip}`}
                            checked={travelerData[pelaksana.nip]?.tidakSewaKendaraan || false}
                            onChange={(e) => handleTidakSewaKendaraanChange(pelaksana.nip, e.target.checked)}
                            className="w-4 h-4 text-[#00475e] border-slate-300 rounded focus:ring-[#00475e]"
                          />
                          <label htmlFor={`tidak-sewa-kendaraan-${pelaksana.nip}`} className="text-[10px] font-bold text-slate-600">
                            Tidak sewa kendaraan
                          </label>
                        </div>

                        {/* Jenis Transportasi */}
                        {!travelerData[pelaksana.nip]?.tidakSewaKendaraan && (
                          <div className="flex gap-2 mb-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`transportasi-${pelaksana.nip}`}
                                checked={travelerData[pelaksana.nip]?.jenisTransportasi === 'darat'}
                                onChange={() => handleJenisTransportasiChange(pelaksana.nip, 'darat')}
                                className="peer hidden"
                              />
                              <div className="px-3 py-2 border border-slate-300 rounded-lg text-center peer-checked:bg-[#00475e] peer-checked:text-white peer-checked:border-[#00475e] transition-all flex items-center justify-center gap-1">
                                <Car className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Darat</span>
                              </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`transportasi-${pelaksana.nip}`}
                                checked={travelerData[pelaksana.nip]?.jenisTransportasi === 'laut'}
                                onChange={() => handleJenisTransportasiChange(pelaksana.nip, 'laut')}
                                className="peer hidden"
                              />
                              <div className="px-3 py-2 border border-slate-300 rounded-lg text-center peer-checked:bg-[#00475e] peer-checked:text-white peer-checked:border-[#00475e] transition-all flex items-center justify-center gap-1">
                                <Ship className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Laut</span>
                              </div>
                            </label>
                          </div>
                        )}

                        {/* Radio buttons for trip type */}
                        {!travelerData[pelaksana.nip]?.tidakSewaKendaraan && (
                          <div className="flex gap-2 mb-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`jenis-${pelaksana.nip}`}
                                checked={travelerData[pelaksana.nip]?.jenisSewaKendaraan === 'pergi'}
                                onChange={() => handleJenisSewaChange(pelaksana.nip, 'pergi')}
                                className="peer hidden"
                              />
                              <div className="px-3 py-2 border border-slate-300 rounded-lg text-center peer-checked:bg-[#00475e] peer-checked:text-white peer-checked:border-[#00475e] transition-all">
                                <span className="text-[10px] font-bold">Pergi</span>
                              </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`jenis-${pelaksana.nip}`}
                                checked={travelerData[pelaksana.nip]?.jenisSewaKendaraan === 'pulang-pergi'}
                                onChange={() => handleJenisSewaChange(pelaksana.nip, 'pulang-pergi')}
                                className="peer hidden"
                              />
                              <div className="px-3 py-2 border border-slate-300 rounded-lg text-center peer-checked:bg-[#00475e] peer-checked:text-white peer-checked:border-[#00475e] transition-all">
                                <span className="text-[10px] font-bold">Pulang Pergi</span>
                              </div>
                            </label>
                          </div>
                        )}

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={travelerData[pelaksana.nip]?.sewaKendaraan ? formatCurrency(travelerData[pelaksana.nip].sewaKendaraan) : ''}
                            onChange={(e) => handleInputChange(pelaksana.nip, 'sewaKendaraan', e.target.value)}
                            disabled={travelerData[pelaksana.nip]?.tidakSewaKendaraan}
                            className={`w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00475e]/20 text-sm font-bold transition-all outline-none ${
                              travelerData[pelaksana.nip]?.tidakSewaKendaraan
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-[#f2f4f6] text-[#191c1e]'
                            }`}
                            placeholder="Standar biaya"
                          />
                        </div>
                        <input
                          ref={(el) => { kendaraanFileRefs.current[pelaksana.nip] = el; }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(pelaksana.nip, 'kendaraan', e.target.files?.[0] || null)}
                          className="hidden"
                          disabled={travelerData[pelaksana.nip]?.tidakSewaKendaraan}
                        />
                        <button
                          onClick={() => kendaraanFileRefs.current[pelaksana.nip]?.click()}
                          disabled={travelerData[pelaksana.nip]?.tidakSewaKendaraan}
                          className={`w-full flex items-center justify-center gap-2 border-2 border-dashed p-2 rounded-xl transition-all group ${
                            travelerData[pelaksana.nip]?.tidakSewaKendaraan
                              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                              : 'border-slate-300 hover:border-[#00475e]/50 bg-white hover:bg-[#00475e]/5'
                          }`}
                        >
                          {travelerData[pelaksana.nip]?.uploadedFiles.kendaraan ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-[10px] font-bold text-green-600 tracking-tight truncate max-w-[150px]">
                                {travelerData[pelaksana.nip].uploadedFiles.kendaraan?.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-500 group-hover:text-[#00475e]" />
                              <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#00475e] tracking-tight">
                                Upload Tiket/Sewa
                              </span>
                            </>
                          )}
                        </button>
                        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Total</p>
                          <p className="text-sm font-black text-green-900">
                            Rp {travelerData[pelaksana.nip]?.totalSewaKendaraan.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            ))}

            {/* Upload Dokumentasi & Laporan Umum */}
            <div className="p-8 border-b border-slate-200 bg-white">
              <h3 className="text-sm font-bold text-[#191c1e] mb-1">
                Dokumentasi & Laporan Perjalanan
              </h3>
              <p className="text-[10px] text-slate-500 mb-6">
                Unggah foto dokumentasi kegiatan dan dokumen laporan hasil perjalanan dinas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dokumentasi */}
                <div>
                  <label className="text-xs font-bold text-[#191c1e] block mb-3">
                    Foto Dokumentasi Kegiatan
                  </label>
                  <input
                    ref={dokumentasiRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setDokumentasiFile(e.target.files[0]);
                        toast.success("Foto dokumentasi berhasil diunggah");
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => dokumentasiRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#00475e]/50 bg-[#f2f4f6] hover:bg-[#00475e]/5 p-4 rounded-xl transition-all group"
                  >
                    {dokumentasiFile ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-bold text-green-600 tracking-tight truncate max-w-[200px]">
                          {dokumentasiFile.name}
                        </span>
                      </>
                    ) : dokumentasiUrl ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-xs font-bold text-green-600 tracking-tight truncate max-w-[200px]">
                            Tersimpan di Server
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(dokumentasiUrl, '_blank');
                          }}
                          className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                        >
                          Lihat
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-500 group-hover:text-[#00475e]" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-[#00475e] tracking-tight">
                          Pilih Foto Dokumentasi
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Laporan Perjalanan */}
                <div>
                  <label className="text-xs font-bold text-[#191c1e] block mb-3">
                    Laporan Perjalanan (PDF)
                  </label>
                  <input
                    ref={laporanRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLaporanFile(e.target.files[0]);
                        toast.success("Laporan perjalanan berhasil diunggah");
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => laporanRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#00475e]/50 bg-[#f2f4f6] hover:bg-[#00475e]/5 p-4 rounded-xl transition-all group"
                  >
                    {laporanFile ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-bold text-green-600 tracking-tight truncate max-w-[200px]">
                          {laporanFile.name}
                        </span>
                      </>
                    ) : laporanUrl ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-xs font-bold text-green-600 tracking-tight truncate max-w-[200px]">
                            Tersimpan di Server
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(laporanUrl, '_blank');
                          }}
                          className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                        >
                          Lihat
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-500 group-hover:text-[#00475e]" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-[#00475e] tracking-tight">
                          Pilih File Laporan
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-[#f2f4f6] shrink-0 flex items-center justify-between shadow-inner">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Total Keseluruhan Realisasi
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#00475e]">
                Rp {calculateGrandTotal().toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-500">
                ({data.pelaksana.length} Pelaksana)
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-transparent text-slate-600 hover:bg-slate-200 font-bold text-sm rounded-xl transition-colors order-2 sm:order-2"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-br from-[#00475e] to-[#1a5f7a] text-white font-bold rounded-xl shadow-lg shadow-[#00475e]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 order-1 sm:order-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan Semua Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
