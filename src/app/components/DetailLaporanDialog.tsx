import React, { useState, useRef } from "react";
import {
  X,
  Calendar,
  DollarSign,
  Hotel,
  Car,
  Upload,
  CheckCircle,
  Plane,
  Train,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { getRateForKota, getProvinsiForKota, STANDAR_BIAYA_LUAR_DAERAH } from "../utils/standarBiayaLuarDaerah";

interface Pelaksana {
  nama: string;
  nip: string;
}

interface DetailLaporanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  pelaksana: Pelaksana;
  sppdData: any;
  initialData?: any;
}

interface OptionalExpense {
  sewaKendaraan: {
    enabled: boolean;
    tempatBerangkat: string;
    tempatTujuan: string;
    hargaPerHari: string;
    lamaSewa: string;
    keterangan: string;
    subtotal: number;
    file: File | null;
  };
  pesawat: {
    enabled: boolean;
    tipe: 'PP' | 'Pergi' | 'Pulang' | '';
    tempatBerangkatPergi: string;
    tempatTujuanPergi: string;
    hargaPergi: string;
    kodeBookingPergi: string;
    filePergi: File | null;
    tempatBerangkatPulang: string;
    tempatTujuanPulang: string;
    hargaPulang: string;
    kodeBookingPulang: string;
    filePulang: File | null;
    subtotal: number;
  };
  keretaApi: {
    enabled: boolean;
    tempatBerangkat: string;
    tempatTujuan: string;
    harga: string;
    keterangan: string;
    subtotal: number;
    file: File | null;
  };
  biayaTol: {
    enabled: boolean;
    total: string;
    keterangan: string;
    file: File | null;
  };
  taxiBandara: {
    enabled: boolean;
    tipe: 'PP' | 'Pergi' | 'Pulang' | '';
    tempatBerangkatPergi: string;
    tempatTujuanPergi: string;
    hargaPergi: string;
    kodeTiketPergi: string;
    filePergi: File | null;
    tempatBerangkatPulang: string;
    tempatTujuanPulang: string;
    hargaPulang: string;
    kodeTiketPulang: string;
    filePulang: File | null;
    subtotal: number;
  };
  biayaRepresentatif: {
    enabled: boolean;
    standarBiaya: string;
    lamaHari: string;
    subtotal: number;
    file: File | null;
  };
}

export function DetailLaporanDialog({
  isOpen,
  onClose,
  onSave,
  pelaksana,
  sppdData,
  initialData,
}: DetailLaporanDialogProps) {
  const calculateDays = (start?: string, end?: string) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive of both days
  };

  const calculatedDays = calculateDays(sppdData.tanggalPergi, sppdData.tanggalKembali);
  const [standardBiayaHotel, setStandardBiayaHotel] =
    useState("");
  const [tidakAdaHotel, setTidakAdaHotel] = useState(false);
  const [namaHotel, setNamaHotel] = useState("");
  const [hotelFile, setHotelFile] = useState<File | null>(null);
  const [panjar, setPanjar] = useState("");


  const [optionalExpenses, setOptionalExpenses] =
    useState<OptionalExpense>({
      sewaKendaraan: {
        enabled: false,
        tempatBerangkat: "",
        tempatTujuan: "",
        hargaPerHari: "",
        lamaSewa: "",
        keterangan: "",
        subtotal: 0,
        file: null,
      },
      pesawat: {
        enabled: false,
        tipe: "",
        tempatBerangkatPergi: "",
        tempatTujuanPergi: "",
        hargaPergi: "",
        kodeBookingPergi: "",
        filePergi: null,
        tempatBerangkatPulang: "",
        tempatTujuanPulang: "",
        hargaPulang: "",
        kodeBookingPulang: "",
        filePulang: null,
        subtotal: 0,
      },
      keretaApi: {
        enabled: false,
        tempatBerangkat: "",
        tempatTujuan: "",
        harga: "",
        keterangan: "",
        subtotal: 0,
        file: null,
      },
      biayaTol: { enabled: false, total: "", keterangan: "", file: null },
      taxiBandara: { 
        enabled: false, 
        tipe: "", 
        tempatBerangkatPergi: "",
        tempatTujuanPergi: "",
        hargaPergi: "", 
        kodeTiketPergi: "", 
        filePergi: null,
        tempatBerangkatPulang: "",
        tempatTujuanPulang: "",
        hargaPulang: "", 
        kodeTiketPulang: "", 
        filePulang: null,
        subtotal: 0 
      },
      biayaRepresentatif: { enabled: false, standarBiaya: "", lamaHari: "", subtotal: 0, file: null },
    });

  React.useEffect(() => {
    if (isOpen && initialData) {
      setPanjar(initialData.panjar ? `Rp ${initialData.panjar.toLocaleString('id-ID')}` : "");
      
      const malam = Math.max(0, calculateDays(sppdData.tanggalPergi, sppdData.tanggalKembali) - 1);
      if (initialData.totalBiayaHotel > 0 && malam > 0) {
        setStandardBiayaHotel(`Rp ${(initialData.totalBiayaHotel / malam).toLocaleString('id-ID')}`);
        setTidakAdaHotel(false);
      } else if (initialData.totalBiayaHotel === 0) {
        setStandardBiayaHotel("");
        setTidakAdaHotel(true);
      }
      
      if (initialData.namaHotel) setNamaHotel(initialData.namaHotel);
      if (initialData.hotelFile) setHotelFile(initialData.hotelFile);
      
      const opts = { ...optionalExpenses };
      if (initialData.sewaKendaraan) opts.sewaKendaraan = initialData.sewaKendaraan;
      if (initialData.pesawat) opts.pesawat = initialData.pesawat;
      if (initialData.keretaApi) opts.keretaApi = initialData.keretaApi;
      if (initialData.biayaTol) {
        // Support backward compatibility if total is passed as number or string
        opts.biayaTol = {
          ...initialData.biayaTol,
          total: typeof initialData.biayaTol.total === 'number' 
            ? `Rp ${initialData.biayaTol.total.toLocaleString('id-ID')}` 
            : initialData.biayaTol.total
        };
      }
      if (initialData.taxiBandara) opts.taxiBandara = initialData.taxiBandara;
      if (initialData.biayaRepresentatif) opts.biayaRepresentatif = initialData.biayaRepresentatif;
      
      setOptionalExpenses(opts);
    }
  }, [isOpen, initialData]);

  const hotelFileRef = useRef<HTMLInputElement>(null);
  const sewaFileRef = useRef<HTMLInputElement>(null);
  const pesawatFilePergiRef = useRef<HTMLInputElement>(null);
  const pesawatFilePulangRef = useRef<HTMLInputElement>(null);
  const keretaFileRef = useRef<HTMLInputElement>(null);
  const tolFileRef = useRef<HTMLInputElement>(null);
  const taxiBandaraFilePergiRef = useRef<HTMLInputElement>(null);
  const taxiBandaraFilePulangRef = useRef<HTMLInputElement>(null);
  const representatifFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const standardUangHarian = getRateForKota(sppdData.kota || "");
  const matchedProvinsi = getProvinsiForKota(sppdData.kota || "");
  const hari = calculatedDays;
  const malam = Math.max(0, hari - 1);

  // Calculate uang harian
  const totalUangHarian = hari * standardUangHarian;

  // Calculate hotel
  const hotelPerMalam =
    parseInt(standardBiayaHotel.replace(/\D/g, "")) || 0;
  const totalBiayaHotel = tidakAdaHotel
    ? 0
    : malam * hotelPerMalam;

  // Calculate total accumulated expenses
  const calculateTotalAkumulasi = () => {
    let total = totalUangHarian + totalBiayaHotel;

    if (optionalExpenses.sewaKendaraan.enabled) {
      total += optionalExpenses.sewaKendaraan.subtotal;
    }
    if (optionalExpenses.pesawat.enabled) {
      total += optionalExpenses.pesawat.subtotal;
    }
    if (optionalExpenses.keretaApi.enabled) {
      total += optionalExpenses.keretaApi.subtotal;
    }
    if (optionalExpenses.biayaTol.enabled) {
      const tol =
        parseInt(
          optionalExpenses.biayaTol.total.replace(/\D/g, ""),
        ) || 0;
      total += tol;
    }
    if (optionalExpenses.taxiBandara.enabled) {
      total += optionalExpenses.taxiBandara.subtotal;
    }
    if (optionalExpenses.biayaRepresentatif.enabled) {
      total += optionalExpenses.biayaRepresentatif.subtotal;
    }

    return total;
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("id-ID") : "";
  };

  const handleOptionalChange = (
    category: keyof OptionalExpense,
    field: string,
    value: string | boolean | File | null,
  ) => {
    setOptionalExpenses((prev) => {
      const updated = { ...prev };

      if (field === "enabled") {
        updated[category] = {
          ...updated[category],
          enabled: value as boolean,
        } as any;
      } else if (field === "file" || field === "filePergi" || field === "filePulang") {
        updated[category] = {
          ...updated[category],
          [field]: value as File | null,
        } as any;
      } else {
        updated[category] = {
          ...updated[category],
          [field]: value,
        } as any;

        // Recalculate subtotals
        if (category === "sewaKendaraan") {
          const harga =
            parseInt(
              updated.sewaKendaraan.hargaPerHari.replace(
                /\D/g,
                "",
              ),
            ) || 0;
          const lama =
            parseInt(updated.sewaKendaraan.lamaSewa) || 0;
          updated.sewaKendaraan.subtotal = harga * lama;
        } else if (category === "pesawat") {
          const pergi =
            parseInt(
              updated.pesawat.hargaPergi.replace(/\D/g, ""),
            ) || 0;
          const pulang =
            parseInt(
              updated.pesawat.hargaPulang.replace(/\D/g, ""),
            ) || 0;
          updated.pesawat.subtotal = pergi + pulang;
        } else if (category === "keretaApi") {
          const harga =
            parseInt(
              updated.keretaApi.harga.replace(/\D/g, ""),
            ) || 0;
          updated.keretaApi.subtotal = harga;
        } else if (category === "taxiBandara") {
          const pergi =
            parseInt(
              updated.taxiBandara.hargaPergi.replace(/\D/g, ""),
            ) || 0;
          const pulang =
            parseInt(
              updated.taxiBandara.hargaPulang.replace(/\D/g, ""),
            ) || 0;
          updated.taxiBandara.subtotal = pergi + pulang;
        } else if (category === "biayaRepresentatif") {
          const harga =
            parseInt(
              updated.biayaRepresentatif.standarBiaya.replace(/\D/g, ""),
            ) || 0;
          const hari = parseInt(updated.biayaRepresentatif.lamaHari) || 0;
          updated.biayaRepresentatif.subtotal = harga * hari;
        }
      }

      return updated;
    });
  };

  const handleFileUpload = (
    ref: React.RefObject<HTMLInputElement | null>,
  ) => {
    ref.current?.click();
  };

  const handleSave = () => {
    toast.success(
      `Laporan untuk ${pelaksana.nama} berhasil disimpan`,
    );
    
    // Construct the data object to pass back
    const panjarValue = parseInt(panjar.replace(/\D/g, "")) || 0;
    const data = {
      ...optionalExpenses, // pass everything to the export function if needed
      jumlahHari: hari,
      totalUangHarian,
      totalBiayaHotel,
      namaHotel,
      hotelFile,
      totalSewaKendaraan: optionalExpenses.sewaKendaraan.enabled ? optionalExpenses.sewaKendaraan.subtotal : 0,
      totalPesawat: optionalExpenses.pesawat.enabled ? optionalExpenses.pesawat.subtotal : 0,
      totalKeretaApi: optionalExpenses.keretaApi.enabled ? optionalExpenses.keretaApi.subtotal : 0,
      totalBiayaTol: optionalExpenses.biayaTol.enabled ? parseInt(optionalExpenses.biayaTol.total.replace(/\D/g, "")) || 0 : 0,
      totalTaxiBandara: optionalExpenses.taxiBandara.enabled ? optionalExpenses.taxiBandara.subtotal : 0,
      totalBiayaRepresentatif: optionalExpenses.biayaRepresentatif.enabled ? optionalExpenses.biayaRepresentatif.subtotal : 0,
      panjar: panjarValue,
      sisa: calculateTotalAkumulasi() - panjarValue
    };
    
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#191c1e]/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-4xl max-h-[921px] overflow-hidden rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <header className="p-8 pb-4 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#c0e8ff] text-[#004d66] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Draft Laporan
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">
              Detail Laporan:{" "}
              <span className="text-[#00475e]">
                {pelaksana.nama}
              </span>
            </h2>
            <p className="text-sm text-[#4c616d] mt-1">
              Lengkapi rincian biaya riil untuk verifikasi
              administrasi SPJ.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#e6e8ea] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#70787d]" />
          </button>
        </header>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-8">
          {/* Global Travel Duration */}
          <div className="bg-[#00475e]/5 border border-[#00475e]/10 p-5 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#00475e] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Durasi Perjalanan
              </h4>
              <p className="text-xs text-[#4c616d]">
                Tentukan jumlah hari untuk kalkulasi otomatis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hari}
                readOnly
                className="w-24 bg-slate-100 border-[#00475e]/20 rounded-lg text-lg font-bold text-[#00475e] text-center outline-none cursor-not-allowed"
                placeholder="Hari"
              />
              <span className="text-sm font-semibold text-[#4c616d]">
                Hari
              </span>
            </div>
          </div>

          {/* Primary Expenses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section: Uang Harian */}
            <div className="bg-[#f2f4f6] p-6 rounded-xl border border-transparent hover:border-[#c0c8cd] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#1a5f7a] text-white rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[#191c1e] tracking-tight">
                  Uang Harian
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                    Kalkulasi Otomatis
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full bg-[#e6e8ea] border-none rounded-md text-sm font-medium text-[#4c616d]"
                      readOnly
                      type="text"
                      value={`Rp ${standardUangHarian.toLocaleString("id-ID")}`}
                      title={matchedProvinsi ? `Rate Provinsi ${matchedProvinsi}` : "Rate Default"}
                    />
                    <span className="text-[#4c616d]">x</span>
                    <div className="bg-[#e6e8ea] px-3 py-1.5 rounded-md text-sm font-bold text-[#00475e]">
                      {hari} Hari
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#c0c8cd]/30">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                    Total Estimasi
                  </label>
                  <p className="text-lg font-bold text-[#00475e] tracking-tight">
                    Rp {totalUangHarian.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Biaya Hotel */}
            <div className="bg-[#f2f4f6] p-6 rounded-xl border border-transparent hover:border-[#c0c8cd] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#7b4f16] text-white rounded-lg">
                  <Hotel className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[#191c1e] tracking-tight">
                  Biaya Hotel
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="tidak-ada-hotel"
                    checked={tidakAdaHotel}
                    onChange={(e) =>
                      setTidakAdaHotel(e.target.checked)
                    }
                    className="w-4 h-4 text-[#00475e] border-[#70787d] rounded focus:ring-[#00475e]"
                  />
                  <label
                    htmlFor="tidak-ada-hotel"
                    className="text-[10px] font-bold text-[#40484d]"
                  >
                    Tidak ada biaya hotel
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                    Standard Biaya / Malam
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={formatCurrency(
                          standardBiayaHotel,
                        )}
                        onChange={(e) =>
                          setStandardBiayaHotel(e.target.value)
                        }
                        disabled={tidakAdaHotel}
                        className={`pl-10 w-full border-[#c0c8cd]/30 rounded-md text-sm font-medium focus:ring-2 focus:ring-[#00475e] placeholder:text-[#70787d]/40 ${
                          tidakAdaHotel
                            ? "bg-[#e6e8ea] text-[#70787d] cursor-not-allowed"
                            : "bg-white"
                        }`}
                        placeholder="Nominal"
                      />
                    </div>
                    <div className="bg-[#e6e8ea] px-3 py-1.5 rounded-md text-sm font-bold text-[#5f3800]">
                      {malam} Malam
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1 mt-2">
                      Nama Hotel
                    </label>
                    <input
                      type="text"
                      value={namaHotel}
                      onChange={(e) => setNamaHotel(e.target.value)}
                      className={`w-full bg-white border border-[#c0c8cd]/50 rounded-md text-sm px-4 py-2.5 focus:ring-2 focus:ring-[#00475e] outline-none font-medium text-[#191c1e] ${
                        tidakAdaHotel ? "bg-[#e6e8ea] text-[#70787d] cursor-not-allowed" : "bg-white"
                      }`}
                      placeholder="Masukkan Nama Hotel"
                      disabled={tidakAdaHotel}
                    />
                  </div>
                </div>
                <div className="relative group">
                  <input
                    ref={hotelFileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setHotelFile(file);
                      if (file)
                        toast.success(
                          `${file.name} berhasil diunggah`,
                        );
                    }}
                    className="hidden"
                    disabled={tidakAdaHotel}
                  />
                  <button
                    onClick={() =>
                      handleFileUpload(hotelFileRef)
                    }
                    disabled={tidakAdaHotel}
                    className={`flex items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-colors ${
                      tidakAdaHotel
                        ? "border-[#c0c8cd] bg-[#f2f4f6] cursor-not-allowed"
                        : "border-[#c0c8cd] group-hover:border-[#00475e] bg-white"
                    }`}
                  >
                    <div className="text-center flex items-center gap-2">
                      {hotelFile ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-[10px] font-bold text-green-600 uppercase">
                            {hotelFile.name}
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#70787d] group-hover:text-[#00475e] transition-colors" />
                          <p className="text-[10px] font-bold text-[#70787d] uppercase">
                            Upload Bill Hotel
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                </div>
                <div className="pt-2 border-t border-[#c0c8cd]/30">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                    Total Biaya Hotel
                  </label>
                  <p className="text-lg font-bold text-[#5f3800] tracking-tight">
                    Rp {totalBiayaHotel.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Fitur Opsional */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#4c616d]">
                Fitur Opsional
              </h3>
              <div className="h-px flex-1 bg-[#e6e8ea]"></div>
            </div>
            <div className="space-y-4">
              {/* Option: Sewa Kendaraan */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.sewaKendaraan.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={
                    optionalExpenses.sewaKendaraan.enabled
                  }
                  onChange={(e) =>
                    handleOptionalChange(
                      "sewaKendaraan",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Sewa Kendaraan
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        Transportasi lokal di lokasi dinas
                      </p>
                    </div>
                    {optionalExpenses.sewaKendaraan.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Sewa
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {optionalExpenses.sewaKendaraan.subtotal.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.sewaKendaraan.enabled && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tempat Berangkat
                        </label>
                        <input
                          type="text"
                          value={optionalExpenses.sewaKendaraan.tempatBerangkat}
                          onChange={(e) =>
                            handleOptionalChange("sewaKendaraan", "tempatBerangkat", e.target.value)
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                          placeholder="Kota / Tempat"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tempat Tujuan
                        </label>
                        <input
                          type="text"
                          value={optionalExpenses.sewaKendaraan.tempatTujuan}
                          onChange={(e) =>
                            handleOptionalChange("sewaKendaraan", "tempatTujuan", e.target.value)
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                          placeholder="Kota / Tempat"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Harga Sewa / Hari
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={formatCurrency(
                              optionalExpenses.sewaKendaraan
                                .hargaPerHari,
                            )}
                            onChange={(e) =>
                              handleOptionalChange(
                                "sewaKendaraan",
                                "hargaPerHari",
                                e.target.value,
                              )
                            }
                            className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Lama Sewa (Hari)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={
                              optionalExpenses.sewaKendaraan
                                .lamaSewa
                            }
                            onChange={(e) =>
                              handleOptionalChange(
                                "sewaKendaraan",
                                "lamaSewa",
                                e.target.value,
                              )
                            }
                            className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] pr-10 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Hari
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center h-10">
                        <input
                          ref={sewaFileRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0] || null;
                            handleOptionalChange(
                              "sewaKendaraan",
                              "file",
                              file,
                            );
                            if (file)
                              toast.success(
                                `${file.name} berhasil diunggah`,
                              );
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() =>
                            handleFileUpload(sewaFileRef)
                          }
                          className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                        >
                          {optionalExpenses.sewaKendaraan
                            .file ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">
                                Uploaded
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Bukti Sewa
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={optionalExpenses.sewaKendaraan.keterangan}
                        onChange={(e) =>
                          handleOptionalChange(
                            "sewaKendaraan",
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                        placeholder="Informasi tambahan..."
                      />
                    </div>
                    </>
                  )}
                </div>
              </div>

              {/* Option: Pesawat Terbang */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.pesawat.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={optionalExpenses.pesawat.enabled}
                  onChange={(e) =>
                    handleOptionalChange(
                      "pesawat",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Pesawat Terbang
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        Tiket Pesawat Keberangkatan & Kepulangan
                      </p>
                    </div>
                    {optionalExpenses.pesawat.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Pesawat
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {optionalExpenses.pesawat.subtotal.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.pesawat.enabled && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tipe Tiket
                        </label>
                        <select
                          value={optionalExpenses.pesawat.tipe}
                          onChange={(e) =>
                            handleOptionalChange(
                              "pesawat",
                              "tipe",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                        >
                          <option value="">Pilih Tipe</option>
                          <option value="PP">Pulang Pergi</option>
                          <option value="Pergi">Pergi Saja</option>
                          <option value="Pulang">Pulang Saja</option>
                        </select>
                      </div>

                      {(optionalExpenses.pesawat.tipe === "PP" || optionalExpenses.pesawat.tipe === "Pergi") && (
                        <div className="p-4 bg-white rounded-lg border border-[#e6e8ea]">
                          <p className="text-xs font-bold text-[#00475e] mb-3 uppercase">Tiket Pergi</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Berangkat
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.tempatBerangkatPergi}
                                onChange={(e) =>
                                  handleOptionalChange("pesawat", "tempatBerangkatPergi", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Bandara"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Tujuan
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.tempatTujuanPergi}
                                onChange={(e) =>
                                  handleOptionalChange("pesawat", "tempatTujuanPergi", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Bandara"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Harga Pergi
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={formatCurrency(
                                    optionalExpenses.pesawat.hargaPergi,
                                  )}
                                  onChange={(e) =>
                                    handleOptionalChange(
                                      "pesawat",
                                      "hargaPergi",
                                      e.target.value,
                                    )
                                  }
                                  className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Kode Booking
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.kodeBookingPergi}
                                onChange={(e) =>
                                  handleOptionalChange(
                                    "pesawat",
                                    "kodeBookingPergi",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kode"
                              />
                            </div>
                            <div className="flex items-center h-10">
                              <input
                                ref={pesawatFilePergiRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleOptionalChange("pesawat", "filePergi", file);
                                  if (file) toast.success(`${file.name} berhasil diunggah`);
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => handleFileUpload(pesawatFilePergiRef)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                              >
                                {optionalExpenses.pesawat.filePergi ? (
                                  <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-600">Uploaded</span></>
                                ) : (
                                  <><Upload className="w-4 h-4" />Upload Tiket</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {(optionalExpenses.pesawat.tipe === "PP" || optionalExpenses.pesawat.tipe === "Pulang") && (
                        <div className="p-4 bg-white rounded-lg border border-[#e6e8ea]">
                          <p className="text-xs font-bold text-[#00475e] mb-3 uppercase">Tiket Pulang</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Berangkat
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.tempatBerangkatPulang}
                                onChange={(e) =>
                                  handleOptionalChange("pesawat", "tempatBerangkatPulang", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Bandara"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Tujuan
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.tempatTujuanPulang}
                                onChange={(e) =>
                                  handleOptionalChange("pesawat", "tempatTujuanPulang", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Bandara"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Harga Pulang
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={formatCurrency(
                                    optionalExpenses.pesawat.hargaPulang,
                                  )}
                                  onChange={(e) =>
                                    handleOptionalChange(
                                      "pesawat",
                                      "hargaPulang",
                                      e.target.value,
                                    )
                                  }
                                  className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Kode Booking
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.pesawat.kodeBookingPulang}
                                onChange={(e) =>
                                  handleOptionalChange(
                                    "pesawat",
                                    "kodeBookingPulang",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kode"
                              />
                            </div>
                            <div className="flex items-center h-10">
                              <input
                                ref={pesawatFilePulangRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleOptionalChange("pesawat", "filePulang", file);
                                  if (file) toast.success(`${file.name} berhasil diunggah`);
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => handleFileUpload(pesawatFilePulangRef)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                              >
                                {optionalExpenses.pesawat.filePulang ? (
                                  <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-600">Uploaded</span></>
                                ) : (
                                  <><Upload className="w-4 h-4" />Upload Tiket</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Option: Kereta Api */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.keretaApi.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={optionalExpenses.keretaApi.enabled}
                  onChange={(e) =>
                    handleOptionalChange(
                      "keretaApi",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Kereta Api
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        Tiket perjalanan antar kota
                      </p>
                    </div>
                    {optionalExpenses.keretaApi.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Kereta
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {optionalExpenses.keretaApi.subtotal.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.keretaApi.enabled && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tempat Berangkat
                        </label>
                        <input
                          type="text"
                          value={optionalExpenses.keretaApi.tempatBerangkat}
                          onChange={(e) =>
                            handleOptionalChange("keretaApi", "tempatBerangkat", e.target.value)
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                          placeholder="Stasiun Asal"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tempat Tujuan
                        </label>
                        <input
                          type="text"
                          value={optionalExpenses.keretaApi.tempatTujuan}
                          onChange={(e) =>
                            handleOptionalChange("keretaApi", "tempatTujuan", e.target.value)
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                          placeholder="Stasiun Tujuan"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Harga Tiket Kereta Api
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={formatCurrency(
                              optionalExpenses.keretaApi.harga,
                            )}
                            onChange={(e) =>
                              handleOptionalChange(
                                "keretaApi",
                                "harga",
                                e.target.value,
                              )
                            }
                            className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none"
                            placeholder="Nominal"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-1 flex items-center h-10">
                        <input
                          ref={keretaFileRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0] || null;
                            handleOptionalChange(
                              "keretaApi",
                              "file",
                              file,
                            );
                            if (file)
                              toast.success(
                                `${file.name} berhasil diunggah`,
                              );
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() =>
                            handleFileUpload(keretaFileRef)
                          }
                          className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                        >
                          {optionalExpenses.keretaApi.file ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">
                                Uploaded
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Lampiran
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={optionalExpenses.keretaApi.keterangan}
                        onChange={(e) =>
                          handleOptionalChange(
                            "keretaApi",
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                        placeholder="Informasi tambahan..."
                      />
                    </div>
                    </>
                  )}
                </div>
              </div>

              {/* Option: Biaya Tol */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.biayaTol.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={optionalExpenses.biayaTol.enabled}
                  onChange={(e) =>
                    handleOptionalChange(
                      "biayaTol",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Biaya Tol
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        E-Toll & Struk Fisik
                      </p>
                    </div>
                    {optionalExpenses.biayaTol.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Tol
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {(
                            parseInt(
                              optionalExpenses.biayaTol.total.replace(
                                /\D/g,
                                "",
                              ),
                            ) || 0
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.biayaTol.enabled && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Total Biaya Tol
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={formatCurrency(
                              optionalExpenses.biayaTol.total,
                            )}
                            onChange={(e) =>
                              handleOptionalChange(
                                "biayaTol",
                                "total",
                                e.target.value,
                              )
                            }
                            className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm font-semibold focus:ring-2 focus:ring-[#00475e] outline-none"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 flex items-center h-10">
                        <input
                          ref={tolFileRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0] || null;
                            handleOptionalChange(
                              "biayaTol",
                              "file",
                              file,
                            );
                            if (file)
                              toast.success(
                                `${file.name} berhasil diunggah`,
                              );
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() =>
                            handleFileUpload(tolFileRef)
                          }
                          className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                        >
                          {optionalExpenses.biayaTol.file ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">
                                Uploaded
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Lampiran
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        value={optionalExpenses.biayaTol.keterangan}
                        onChange={(e) =>
                          handleOptionalChange(
                            "biayaTol",
                            "keterangan",
                            e.target.value
                          )
                        }
                        className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                        placeholder="Informasi tambahan..."
                      />
                    </div>
                    </>
                  )}
                </div>
              </div>

              {/* Option: Taxi Bandara */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.taxiBandara.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={optionalExpenses.taxiBandara.enabled}
                  onChange={(e) =>
                    handleOptionalChange(
                      "taxiBandara",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Taxi Bandara
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        Transportasi dari/ke Bandara
                      </p>
                    </div>
                    {optionalExpenses.taxiBandara.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Taxi
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {optionalExpenses.taxiBandara.subtotal.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.taxiBandara.enabled && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Tipe Perjalanan
                        </label>
                        <select
                          value={optionalExpenses.taxiBandara.tipe}
                          onChange={(e) =>
                            handleOptionalChange(
                              "taxiBandara",
                              "tipe",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                        >
                          <option value="">Pilih Tipe</option>
                          <option value="PP">Pulang Pergi</option>
                          <option value="Pergi">Pergi Saja</option>
                          <option value="Pulang">Pulang Saja</option>
                        </select>
                      </div>

                      {(optionalExpenses.taxiBandara.tipe === "PP" || optionalExpenses.taxiBandara.tipe === "Pergi") && (
                        <div className="p-4 bg-white rounded-lg border border-[#e6e8ea]">
                          <p className="text-xs font-bold text-[#00475e] mb-3 uppercase">Taxi Pergi</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Berangkat
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.tempatBerangkatPergi}
                                onChange={(e) =>
                                  handleOptionalChange("taxiBandara", "tempatBerangkatPergi", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Tempat"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Tujuan
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.tempatTujuanPergi}
                                onChange={(e) =>
                                  handleOptionalChange("taxiBandara", "tempatTujuanPergi", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Bandara / Tempat"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Harga Taxi
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={formatCurrency(
                                    optionalExpenses.taxiBandara.hargaPergi,
                                  )}
                                  onChange={(e) =>
                                    handleOptionalChange(
                                      "taxiBandara",
                                      "hargaPergi",
                                      e.target.value,
                                    )
                                  }
                                  className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Keterangan / Kode Tiket
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.kodeTiketPergi}
                                onChange={(e) =>
                                  handleOptionalChange(
                                    "taxiBandara",
                                    "kodeTiketPergi",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kode Tiket"
                              />
                            </div>
                            <div className="flex items-center h-10">
                              <input
                                ref={taxiBandaraFilePergiRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleOptionalChange("taxiBandara", "filePergi", file);
                                  if (file) toast.success(`${file.name} berhasil diunggah`);
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => handleFileUpload(taxiBandaraFilePergiRef)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                              >
                                {optionalExpenses.taxiBandara.filePergi ? (
                                  <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-600">Uploaded</span></>
                                ) : (
                                  <><Upload className="w-4 h-4" />Upload Bukti</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {(optionalExpenses.taxiBandara.tipe === "PP" || optionalExpenses.taxiBandara.tipe === "Pulang") && (
                        <div className="p-4 bg-white rounded-lg border border-[#e6e8ea]">
                          <p className="text-xs font-bold text-[#00475e] mb-3 uppercase">Taxi Pulang</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Berangkat
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.tempatBerangkatPulang}
                                onChange={(e) =>
                                  handleOptionalChange("taxiBandara", "tempatBerangkatPulang", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Bandara / Tempat"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Tempat Tujuan
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.tempatTujuanPulang}
                                onChange={(e) =>
                                  handleOptionalChange("taxiBandara", "tempatTujuanPulang", e.target.value)
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kota / Tempat"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Harga Taxi
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={formatCurrency(
                                    optionalExpenses.taxiBandara.hargaPulang,
                                  )}
                                  onChange={(e) =>
                                    handleOptionalChange(
                                      "taxiBandara",
                                      "hargaPulang",
                                      e.target.value,
                                    )
                                  }
                                  className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                                Keterangan / Kode Tiket
                              </label>
                              <input
                                type="text"
                                value={optionalExpenses.taxiBandara.kodeTiketPulang}
                                onChange={(e) =>
                                  handleOptionalChange(
                                    "taxiBandara",
                                    "kodeTiketPulang",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none py-2 px-3"
                                placeholder="Kode Tiket"
                              />
                            </div>
                            <div className="flex items-center h-10">
                              <input
                                ref={taxiBandaraFilePulangRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleOptionalChange("taxiBandara", "filePulang", file);
                                  if (file) toast.success(`${file.name} berhasil diunggah`);
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => handleFileUpload(taxiBandaraFilePulangRef)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00475e] border border-[#00475e]/20 px-4 py-2 rounded-lg hover:bg-[#00475e]/5 transition-colors"
                              >
                                {optionalExpenses.taxiBandara.filePulang ? (
                                  <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-600">Uploaded</span></>
                                ) : (
                                  <><Upload className="w-4 h-4" />Upload Bukti</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Option: Biaya Representatif */}
              <div
                className={`flex items-start gap-4 p-5 bg-[#f7f9fb] rounded-xl border transition-all ${
                  optionalExpenses.biayaRepresentatif.enabled
                    ? "border-[#00475e]/20 ring-1 ring-[#00475e]/10"
                    : "border-[#c0c8cd]/20"
                } hover:shadow-sm`}
              >
                <input
                  type="checkbox"
                  checked={optionalExpenses.biayaRepresentatif.enabled}
                  onChange={(e) =>
                    handleOptionalChange(
                      "biayaRepresentatif",
                      "enabled",
                      e.target.checked,
                    )
                  }
                  className="mt-1 w-5 h-5 rounded border-[#c0c8cd] text-[#00475e] focus:ring-[#00475e] transition-all"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-[#191c1e] text-sm">
                        Biaya Representatif
                      </p>
                      <p className="text-xs text-[#4c616d]">
                        Uang saku representatif
                      </p>
                    </div>
                    {optionalExpenses.biayaRepresentatif.enabled && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#00475e] uppercase">
                          Total Biaya Representatif
                        </p>
                        <p className="text-sm font-bold text-[#00475e]">
                          Rp{" "}
                          {optionalExpenses.biayaRepresentatif.subtotal.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {optionalExpenses.biayaRepresentatif.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Standar Biaya
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Rp
                          </span>
                          <input
                            type="text"
                            value={formatCurrency(
                              optionalExpenses.biayaRepresentatif.standarBiaya,
                            )}
                            onChange={(e) =>
                              handleOptionalChange(
                                "biayaRepresentatif",
                                "standarBiaya",
                                e.target.value,
                              )
                            }
                            className="pl-10 w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4c616d] mb-1">
                          Lama Hari
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={optionalExpenses.biayaRepresentatif.lamaHari}
                            onChange={(e) =>
                              handleOptionalChange(
                                "biayaRepresentatif",
                                "lamaHari",
                                e.target.value,
                              )
                            }
                            className="w-full bg-[#f2f4f6] border-none rounded-md text-sm focus:ring-2 focus:ring-[#00475e] pr-10 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                            Hari
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Total Akumulasi Biaya */}
          <div className="mt-12 pt-8 border-t-2 border-[#00475e]/10">
            <div className="bg-[#1a5f7a]/10 p-6 rounded-xl border border-[#00475e]/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#00475e]">
                  Total Akumulasi Biaya
                </h3>
                <Coins className="w-5 h-5 text-[#00475e]" />
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4c616d]">
                    Uang Harian ({hari} Hari)
                  </span>
                  <span className="font-medium text-[#191c1e]">
                    Rp {totalUangHarian.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4c616d]">
                    Biaya Hotel ({malam} Malam)
                  </span>
                  <span className="font-medium text-[#191c1e]">
                    Rp {totalBiayaHotel.toLocaleString("id-ID")}
                  </span>
                </div>
                {optionalExpenses.sewaKendaraan.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Sewa Kendaraan (
                      {optionalExpenses.sewaKendaraan.lamaSewa}{" "}
                      Hari)
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {optionalExpenses.sewaKendaraan.subtotal.toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                )}
                {optionalExpenses.pesawat.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Tiket Pesawat (PP)
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {optionalExpenses.pesawat.subtotal.toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                )}
                {optionalExpenses.keretaApi.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Kereta Api
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {optionalExpenses.keretaApi.subtotal.toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                )}
                {optionalExpenses.biayaTol.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Biaya Tol
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {(
                        parseInt(
                          optionalExpenses.biayaTol.total.replace(
                            /\D/g,
                            "",
                          ),
                        ) || 0
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {optionalExpenses.taxiBandara.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Taxi Bandara
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {optionalExpenses.taxiBandara.subtotal.toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}
                {optionalExpenses.biayaRepresentatif.enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c616d]">
                      Biaya Representatif ({optionalExpenses.biayaRepresentatif.lamaHari} Hari)
                    </span>
                    <span className="font-medium text-[#191c1e]">
                      Rp{" "}
                      {optionalExpenses.biayaRepresentatif.subtotal.toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#00475e]/20 flex justify-between items-end">
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-[10px] font-bold text-[#00475e] uppercase tracking-widest">
                      Total Keseluruhan
                    </p>
                    <p className="text-xl font-bold text-[#00475e] tracking-tight">
                      Rp {calculateTotalAkumulasi().toLocaleString("id-ID")}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center w-full">
                    <label className="text-[10px] font-bold text-[#00475e] uppercase tracking-widest">
                      Uang Panjar
                    </label>
                    <div className="relative w-1/2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#70787d]">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={formatCurrency(panjar)}
                        onChange={(e) => setPanjar(e.target.value)}
                        className="pl-10 w-full bg-white border border-[#c0c8cd]/50 rounded-md text-sm focus:ring-2 focus:ring-[#00475e] outline-none text-right font-semibold text-[#1a5f7a]"
                        placeholder="Nominal Panjar"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center w-full pt-4 border-t border-[#00475e]/10">
                    <p className="text-[10px] font-bold text-[#00475e] uppercase tracking-widest">
                      Sisa Lebih / (Kurang)
                    </p>
                    <p className={`text-2xl font-black tracking-tighter ${
                      calculateTotalAkumulasi() - (parseInt(panjar.replace(/\D/g, "")) || 0) < 0 
                      ? "text-red-600" 
                      : "text-[#00475e]"
                    }`}>
                      Rp {(calculateTotalAkumulasi() - (parseInt(panjar.replace(/\D/g, "")) || 0)).toLocaleString("id-ID")}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[10px] italic text-[#4c616d]">
                      *Terhitung berdasarkan komponen yang dipilih
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <footer className="p-8 border-t border-[#e6e8ea] bg-white shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-[#4c616d] hover:text-[#00475e] transition-colors flex items-center gap-2 group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
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
            Kembali
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setStandardBiayaHotel("");
                setNamaHotel("");
                setTidakAdaHotel(false);
                setHotelFile(null);
                setOptionalExpenses({
                  sewaKendaraan: {
                    enabled: false,
                    tempatBerangkat: "",
                    tempatTujuan: "",
                    hargaPerHari: "",
                    lamaSewa: "",
                    keterangan: "",
                    subtotal: 0,
                    file: null,
                  },
                  pesawat: {
                    enabled: false,
                    tipe: "",
                    tempatBerangkatPergi: "",
                    tempatTujuanPergi: "",
                    hargaPergi: "",
                    kodeBookingPergi: "",
                    filePergi: null,
                    tempatBerangkatPulang: "",
                    tempatTujuanPulang: "",
                    hargaPulang: "",
                    kodeBookingPulang: "",
                    filePulang: null,
                    subtotal: 0,
                  },
                  keretaApi: {
                    enabled: false,
                    tempatBerangkat: "",
                    tempatTujuan: "",
                    harga: "",
                    keterangan: "",
                    subtotal: 0,
                    file: null,
                  },
                  biayaTol: {
                    enabled: false,
                    total: "",
                    keterangan: "",
                    file: null,
                  },
                  taxiBandara: {
                    enabled: false,
                    tipe: "",
                    tempatBerangkatPergi: "",
                    tempatTujuanPergi: "",
                    hargaPergi: "",
                    kodeTiketPergi: "",
                    filePergi: null,
                    tempatBerangkatPulang: "",
                    tempatTujuanPulang: "",
                    hargaPulang: "",
                    kodeTiketPulang: "",
                    filePulang: null,
                    subtotal: 0,
                  },
                  biayaRepresentatif: {
                    enabled: false,
                    standarBiaya: "",
                    lamaHari: "",
                    subtotal: 0,
                    file: null,
                  },
                });
              }}
              className="px-6 py-2.5 text-sm font-bold text-[#40484d] hover:bg-[#e6e8ea] border border-[#c0c8cd] rounded-xl transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-[#00475e] to-[#1a5f7a] rounded-xl shadow-lg shadow-[#00475e]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Simpan & Kembali
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
