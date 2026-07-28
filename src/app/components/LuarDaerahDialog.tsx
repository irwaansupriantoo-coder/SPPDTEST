import React, { useState } from 'react';
import { X, User, Send, AlertCircle, FileText, Upload, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { DetailLaporanDialog } from './DetailLaporanDialog';
import { exportRincianExcel } from '../utils/exportRincianExcel';
import { exportKwitansiLuarDaerah } from '../utils/exportKwitansiLuarDaerah';
import { DocumentViewerDialog } from './DocumentViewerDialog';
import { get, set } from 'idb-keyval';
import { saveFile } from '../utils/fileStore';

interface Pelaksana {
  nama: string;
  nip: string;
  statusLaporan?: 'sudah_lengkap' | 'belum_lengkap';
}

interface LuarDaerahDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (travelerData?: any) => void;
  data: {
    noSpt: string;
    noSppd: string;
    pelaksana: Pelaksana[];
    tipePerjalanan: string;
    tanggalPergi?: string;
    tanggalKembali?: string;
    kota?: string;
  };
}

export function LuarDaerahDialog({ isOpen, onClose, onSave, data }: LuarDaerahDialogProps) {
  const [travelerStatus, setTravelerStatus] = useState<{ [key: string]: 'sudah_lengkap' | 'belum_lengkap' }>(
    data.pelaksana.reduce((acc, p) => ({
      ...acc,
      [p.nip]: p.statusLaporan || 'belum_lengkap'
    }), {})
  );
  const [travelerData, setTravelerData] = useState<{ [nip: string]: any }>({});
  
  const [selectedPelaksana, setSelectedPelaksana] = useState<Pelaksana | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [dokumentasiFile, setDokumentasiFile] = useState<File | null>(null);
  const [laporanFile, setLaporanFile] = useState<File | null>(null);
  
  const [dokumentasiUrl, setDokumentasiUrl] = useState<string>("");
  const [laporanUrl, setLaporanUrl] = useState<string>("");

  React.useEffect(() => {
    if (data?.noSppd) {
      const load = async () => {
        try {
          const savedStatus = await get(`draft_traveler_status_${data.noSppd}`);
          const savedData = await get(`draft_traveler_data_${data.noSppd}`);
          const savedDokumentasi = await get(`draft_dokumentasi_${data.noSppd}`);
          const savedLaporan = await get(`draft_laporan_${data.noSppd}`);
          
          if (savedStatus) {
            setTravelerStatus(prev => ({ ...prev, ...savedStatus }));
          }
          if (savedData) {
            setTravelerData(prev => ({ ...prev, ...savedData }));
          }
          if (savedDokumentasi) setDokumentasiFile(savedDokumentasi);
          if (savedLaporan) setLaporanFile(savedLaporan);
          
          // Check server for existing files
          const { getSupabaseClient } = await import('../utils/supabaseClient');
          const sb = getSupabaseClient();
          
          const dokKey = `sppd_dokumentasi_${data.noSppd}`;
          const { data: dokUrl } = await sb.storage.from('sppd-documents').createSignedUrl(dokKey, 3600);
          if (dokUrl?.signedUrl) setDokumentasiUrl(dokUrl.signedUrl);
          
          const lapKey = `sppd_laporan_${data.noSppd}`;
          const { data: lapUrl } = await sb.storage.from('sppd-documents').createSignedUrl(lapKey, 3600);
          if (lapUrl?.signedUrl) setLaporanUrl(lapUrl.signedUrl);
        } catch (e) {
          console.error("Failed to load data", e);
        }
      };
      load();
    }
  }, [data?.noSppd]);

  const dokumentasiInputRef = React.useRef<HTMLInputElement>(null);
  const laporanInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getInitials = (nama: string) => {
    const words = nama.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nama.substring(0, 2).toUpperCase();
  };

  const getInitialColor = (index: number) => {
    const colors = [
      { bg: 'bg-[#00475e]/10', text: 'text-[#00475e]' },
      { bg: 'bg-red-100', text: 'text-red-700' },
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' },
      { bg: 'bg-orange-100', text: 'text-orange-700' },
    ];
    return colors[index % colors.length];
  };

  const getBorderColor = (nip: string) => {
    return travelerStatus[nip] === 'belum_lengkap' ? 'border-l-4 border-error/50' : '';
  };

  const handleLengkapiLaporan = (pelaksana: Pelaksana) => {
    setSelectedPelaksana(pelaksana);
    setIsDetailDialogOpen(true);
  };

  const handleEditLaporan = (pelaksana: Pelaksana) => {
    setSelectedPelaksana(pelaksana);
    setIsDetailDialogOpen(true);
  };

  const handleSaveDetail = async (detailData: any) => {
    if (selectedPelaksana) {
      const nip = selectedPelaksana.nip;
      const newStatus = { ...travelerStatus, [nip]: 'sudah_lengkap' as const };
      
      // Upload all files to Supabase immediately and replace with markers
      const processedData = { ...detailData };
      toast.info('Mengunggah file ke server...');
      
      try {
        if (processedData.hotelFile instanceof File) {
          await saveFile(`sppd_hotel_${data.noSppd}_${nip}`, processedData.hotelFile);
          delete processedData.hotelFile;
        }
        if (processedData.sewaKendaraan?.file instanceof File) {
          await saveFile(`sppd_kendaraan_${data.noSppd}_${nip}`, processedData.sewaKendaraan.file);
          delete processedData.sewaKendaraan.file;
        }
        if (processedData.pesawat?.filePergi instanceof File) {
          await saveFile(`sppd_pesawat_pergi_${data.noSppd}_${nip}`, processedData.pesawat.filePergi);
          delete processedData.pesawat.filePergi;
        }
        if (processedData.pesawat?.filePulang instanceof File) {
          await saveFile(`sppd_pesawat_pulang_${data.noSppd}_${nip}`, processedData.pesawat.filePulang);
          delete processedData.pesawat.filePulang;
        }
        if (processedData.keretaApi?.file instanceof File) {
          await saveFile(`sppd_kereta_${data.noSppd}_${nip}`, processedData.keretaApi.file);
          delete processedData.keretaApi.file;
        }
        if (processedData.taxiBandara?.filePergi instanceof File) {
          await saveFile(`sppd_taxi_pergi_${data.noSppd}_${nip}`, processedData.taxiBandara.filePergi);
          delete processedData.taxiBandara.filePergi;
        }
        if (processedData.taxiBandara?.filePulang instanceof File) {
          await saveFile(`sppd_taxi_pulang_${data.noSppd}_${nip}`, processedData.taxiBandara.filePulang);
          delete processedData.taxiBandara.filePulang;
        }
        if (processedData.biayaTol?.file instanceof File) {
          await saveFile(`sppd_tol_${data.noSppd}_${nip}`, processedData.biayaTol.file);
          delete processedData.biayaTol.file;
        }
        if (processedData.biayaRepresentatif?.file instanceof File) {
          await saveFile(`sppd_representatif_${data.noSppd}_${nip}`, processedData.biayaRepresentatif.file);
          delete processedData.biayaRepresentatif.file;
        }
        if (processedData.kwitansiFile instanceof File) {
          await saveFile(`sppd_kwitansi_${data.noSppd}`, processedData.kwitansiFile);
          delete processedData.kwitansiFile;
        }
        if (processedData.rincianFile instanceof File) {
          await saveFile(`sppd_rincian_${data.noSppd}`, processedData.rincianFile);
          delete processedData.rincianFile;
        }
        if (processedData.sppdVisumFile instanceof File) {
          await saveFile(`sppd_tervisum_${data.noSppd}`, processedData.sppdVisumFile);
          delete processedData.sppdVisumFile;
        }
      } catch (err) {
        toast.error('Gagal mengunggah file ke server.');
        console.error(err);
        return; // stop save if upload fails
      }

      const newData = { ...travelerData, [nip]: processedData };
      setTravelerStatus(newStatus);
      setTravelerData(newData);
      
      try {
        await set(`draft_traveler_status_${data.noSppd}`, newStatus);
        await set(`draft_traveler_data_${data.noSppd}`, newData);
      } catch (e) {
        console.error("Failed to save to IndexedDB", e);
      }
    }
  };

  const handleSubmit = async () => {
    const belumLengkapList = Object.entries(travelerStatus)
      .filter(([nip, status]) => status === 'belum_lengkap')
      .map(([nip]) => data.pelaksana.find(p => p.nip === nip)?.nama);

    if (belumLengkapList.length > 0) {
      toast.error(`Masih ada ${belumLengkapList.length} pelaksana yang belum melengkapi laporan`);
      return;
    }
    
    toast.info('Menyimpan laporan beserta file dokumen...');
    try {
      if (dokumentasiFile instanceof File) await saveFile(`sppd_dokumentasi_${data.noSppd}`, dokumentasiFile);
      if (laporanFile instanceof File) await saveFile(`sppd_laporan_${data.noSppd}`, laporanFile);

      for (const [nip, td] of Object.entries(travelerData)) {
        if (td.hotelFile instanceof File) await saveFile(`sppd_hotel_${data.noSppd}_${nip}`, td.hotelFile);
        if (td.sewaKendaraan?.file instanceof File) await saveFile(`sppd_kendaraan_${data.noSppd}_${nip}`, td.sewaKendaraan.file);
        if (td.pesawat?.filePergi instanceof File) await saveFile(`sppd_pesawat_pergi_${data.noSppd}_${nip}`, td.pesawat.filePergi);
        if (td.pesawat?.filePulang instanceof File) await saveFile(`sppd_pesawat_pulang_${data.noSppd}_${nip}`, td.pesawat.filePulang);
        if (td.keretaApi?.file instanceof File) await saveFile(`sppd_kereta_${data.noSppd}_${nip}`, td.keretaApi.file);
        if (td.taxiBandara?.filePergi instanceof File) await saveFile(`sppd_taxi_pergi_${data.noSppd}_${nip}`, td.taxiBandara.filePergi);
        if (td.taxiBandara?.filePulang instanceof File) await saveFile(`sppd_taxi_pulang_${data.noSppd}_${nip}`, td.taxiBandara.filePulang);
        if (td.biayaTol?.file instanceof File) await saveFile(`sppd_tol_${data.noSppd}_${nip}`, td.biayaTol.file);
        if (td.biayaRepresentatif?.file instanceof File) await saveFile(`sppd_representatif_${data.noSppd}_${nip}`, td.biayaRepresentatif.file);
        
        // Rescue kwitansi and rincian if uploaded per-traveler
        if (td.kwitansiFile instanceof File) await saveFile(`sppd_kwitansi_${data.noSppd}`, td.kwitansiFile);
        if (td.rincianFile instanceof File) await saveFile(`sppd_rincian_${data.noSppd}`, td.rincianFile);
        if (td.sppdVisumFile instanceof File) await saveFile(`sppd_tervisum_${data.noSppd}`, td.sppdVisumFile);
      }
      
      toast.success('Laporan kolektif dan dokumen berhasil diunggah ke server.');
      onSave(travelerData);
      onClose();
    } catch (error) {
      console.error('Failed to save files', error);
      toast.error('Gagal mengunggah file dokumen ke server.');
    }
  };

  const belumLengkapCount = Object.values(travelerStatus).filter(s => s === 'belum_lengkap').length;
  const isAllComplete = belumLengkapCount === 0;

  // Get names of incomplete travelers
  const incompleteTravelers = data.pelaksana
    .filter(p => travelerStatus[p.nip] === 'belum_lengkap')
    .map(p => p.nama);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#191c1e]/30 backdrop-blur-md" onClick={onClose}></div>

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-slate-200/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 bg-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#00475e] mb-1">Data Pelaku Perjalanan - Luar Daerah</h2>
            <p className="text-sm text-slate-500">Berikut adalah daftar pelaksana perjalanan dinas. Mohon lengkapi laporan perorangan.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Table */}
        <div className="flex-grow overflow-y-auto px-8 py-6 bg-[#f8f9fa]">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-4 pb-2">Nama Pelaksana</th>
                <th className="px-4 pb-2">NIP</th>
                <th className="px-4 pb-2">Status Laporan</th>
                <th className="px-4 pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.pelaksana.map((pelaksana, index) => (
                <tr key={pelaksana.nip} className="group transition-all duration-200 shadow-sm hover:shadow-md bg-white rounded-xl">
                  <td className={`px-4 py-4 first:rounded-l-xl border-y border-l border-slate-100 ${getBorderColor(pelaksana.nip)}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${getInitialColor(index).bg} flex items-center justify-center ${getInitialColor(index).text} font-bold text-xs`}>
                        {getInitials(pelaksana.nama)}
                      </div>
                      <span className="font-bold text-slate-800">{pelaksana.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-500 border-y border-slate-100">{pelaksana.nip}</td>
                  <td className="px-4 py-4 border-y border-slate-100">
                    {travelerStatus[pelaksana.nip] === 'sudah_lengkap' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Sudah Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        Belum Lengkap
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 last:rounded-r-xl border-y border-r border-slate-100 text-right">
                    {travelerStatus[pelaksana.nip] === 'sudah_lengkap' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditLaporan(pelaksana)}
                          className="text-[#00475e] font-bold hover:bg-slate-50 px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Edit Laporan
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPelaksana(pelaksana);
                            setIsViewerOpen(true);
                          }}
                          className="bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Dokumen
                        </button>
                        <button
                          onClick={() => {
                            const rincian = travelerData[pelaksana.nip];
                            if (rincian) {
                              toast.promise(
                                exportRincianExcel(pelaksana, data, rincian),
                                {
                                  loading: 'Menyiapkan Excel...',
                                  success: 'Excel berhasil diunduh',
                                  error: 'Gagal mengunduh Excel. Pastikan template tersedia di server.'
                                }
                              );
                            }
                          }}
                          className="bg-green-100 text-green-700 font-bold hover:bg-green-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Unduh Rincian
                        </button>
                        <button
                          onClick={() => {
                            const rincian = travelerData[pelaksana.nip];
                            if (rincian) {
                              toast.promise(
                                exportKwitansiLuarDaerah(pelaksana, data, rincian),
                                {
                                  loading: 'Menyiapkan Kwitansi...',
                                  success: 'Kwitansi berhasil diunduh',
                                  error: 'Gagal mengunduh Kwitansi. Pastikan template tersedia di server.'
                                }
                              );
                            }
                          }}
                          className="bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Unduh Kwitansi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLengkapiLaporan(pelaksana)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00475e] text-white text-xs font-bold rounded-lg hover:bg-[#00384a] transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Lengkapi Laporan Perorangan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Dokumen Section */}
        <div className="px-8 py-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-[#00475e] mb-4">Dokumen Pendukung Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dokumentasi */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Dokumentasi</p>
                <p className="text-[10px] text-slate-500 mt-1">Upload foto kegiatan</p>
                {dokumentasiFile ? (
                  <p className="text-xs text-[#00475e] font-semibold mt-2 max-w-[150px] truncate">
                    {dokumentasiFile.name}
                  </p>
                ) : dokumentasiUrl ? (
                  <p className="text-xs text-[#00475e] font-semibold mt-2 max-w-[150px] truncate">
                    Tersimpan di Server
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {(dokumentasiFile || dokumentasiUrl) && (
                  <button 
                    onClick={() => {
                      if (dokumentasiFile) {
                        const url = URL.createObjectURL(dokumentasiFile);
                        window.open(url, '_blank');
                      } else if (dokumentasiUrl) {
                        window.open(dokumentasiUrl, '_blank');
                      }
                    }}
                    className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors" title="Lihat">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => dokumentasiInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#00475e] text-white text-xs font-bold rounded hover:bg-[#00384a] transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input 
                  type="file" 
                  ref={dokumentasiInputRef} 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setDokumentasiFile(file);
                      if (data?.noSppd) {
                        toast.info('Mengunggah file ke server...');
                        saveFile(`sppd_dokumentasi_${data.noSppd}`, file).catch(console.error);
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Laporan Perjalanan Dinas */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Laporan Perjalanan Dinas</p>
                <p className="text-[10px] text-slate-500 mt-1">Upload dokumen laporan</p>
                {laporanFile ? (
                  <p className="text-xs text-[#00475e] font-semibold mt-2 max-w-[150px] truncate">
                    {laporanFile.name}
                  </p>
                ) : laporanUrl ? (
                  <p className="text-xs text-[#00475e] font-semibold mt-2 max-w-[150px] truncate">
                    Tersimpan di Server
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {(laporanFile || laporanUrl) && (
                  <button 
                    onClick={() => {
                      if (laporanFile) {
                        const url = URL.createObjectURL(laporanFile);
                        window.open(url, '_blank');
                      } else if (laporanUrl) {
                        window.open(laporanUrl, '_blank');
                      }
                    }}
                    className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors" title="Lihat">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => laporanInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#00475e] text-white text-xs font-bold rounded hover:bg-[#00384a] transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input 
                  type="file" 
                  ref={laporanInputRef} 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setLaporanFile(file);
                      if (data?.noSppd) {
                        toast.info('Mengunggah file ke server...');
                        saveFile(`sppd_laporan_${data.noSppd}`, file).catch(console.error);
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-[#f8f9fa] flex justify-between items-center border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
            {!isAllComplete && (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-semibold">
                  {incompleteTravelers.join(', ')} Laporan belum lengkap.
                </span>
              </>
            )}
            {isAllComplete && (
              <>
                <svg className="w-5 h-5 text-green-600 fill-current" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span className="text-green-700 font-bold">Semua pelaksana sudah melengkapi laporan.</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isAllComplete}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm inline-flex items-center gap-2 transition-colors ${
                isAllComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Submit Laporan Kolektif
            </button>
          </div>
        </div>
      </div>

      {/* Detail Laporan Dialog */}
      {selectedPelaksana && (
        <DetailLaporanDialog
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedPelaksana(null);
          }}
          onSave={handleSaveDetail}
          pelaksana={selectedPelaksana}
          sppdData={data}
          initialData={travelerData[selectedPelaksana.nip]}
        />
      )}

      {/* Document Viewer Dialog */}
      {selectedPelaksana && (
        <DocumentViewerDialog
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedPelaksana(null);
          }}
          rincianData={travelerData[selectedPelaksana.nip]}
          pelaksana={selectedPelaksana}
          sppdData={data}
          onUploadFile={async (key, file) => {
            if (selectedPelaksana) {
              const nip = selectedPelaksana.nip;
              const newData = {
                ...travelerData,
                [nip]: {
                  ...travelerData[nip],
                  [key]: file
                }
              };
              setTravelerData(newData);
              if (data?.noSppd) {
                await set(`draft_traveler_data_${data.noSppd}`, newData).catch(console.error);
              }
              toast.success('Dokumen berhasil diunggah');
            }
          }}
        />
      )}
    </div>
  );
}
