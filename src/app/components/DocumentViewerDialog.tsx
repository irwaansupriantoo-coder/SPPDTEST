import React, { useRef, useState, useEffect } from 'react';
import { X, FileText, Download, Upload, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabaseClient';

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rincianData: any;
  pelaksana: any;
  sppdData?: any;
  onUploadFile: (key: string, file: File) => void;
  isEditable?: boolean;
}

export function DocumentViewerDialog({ isOpen, onClose, rincianData, pelaksana, sppdData, onUploadFile, isEditable = true }: DocumentViewerDialogProps) {
  const kwitansiRef = useRef<HTMLInputElement>(null);
  const rincianRef = useRef<HTMLInputElement>(null);
  const sppdVisumRef = useRef<HTMLInputElement>(null);
  
  const [serverFiles, setServerFiles] = useState<{ label: string; url: string; name: string; keyPath: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sppdData?.noSppd || !pelaksana?.nip) return;

    const loadServerFiles = async () => {
      setIsLoading(true);
      try {
        const sb = getSupabaseClient();
        const noSppd = sppdData.noSppd;
        const nip = pelaksana.nip;

        const expectedFiles = [
          { key: `sppd_kwitansi_${noSppd}`, label: 'Kwitansi Perjalanan Dinas', keyPath: 'kwitansiFile' },
          { key: `sppd_rincian_${noSppd}`, label: 'Rincian Perjalanan Dinas', keyPath: 'rincianFile' },
          { key: `sppd_tervisum_${noSppd}`, label: 'SPPD Visum', keyPath: 'sppdVisumFile' },
          { key: `sppd_hotel_${noSppd}_${nip}`, label: 'Bill Hotel', keyPath: 'hotelFile' },
          { key: `sppd_kendaraan_${noSppd}_${nip}`, label: 'Sewa Kendaraan', keyPath: 'sewaKendaraan.file' },
          { key: `sppd_pesawat_pergi_${noSppd}_${nip}`, label: 'Tiket Pesawat (Pergi)', keyPath: 'pesawat.filePergi' },
          { key: `sppd_pesawat_pulang_${noSppd}_${nip}`, label: 'Tiket Pesawat (Pulang)', keyPath: 'pesawat.filePulang' },
          { key: `sppd_kereta_${noSppd}_${nip}`, label: 'Tiket Kereta Api', keyPath: 'keretaApi.file' },
          { key: `sppd_taxi_pergi_${noSppd}_${nip}`, label: 'Taxi Bandara (Pergi)', keyPath: 'taxiBandara.filePergi' },
          { key: `sppd_taxi_pulang_${noSppd}_${nip}`, label: 'Taxi Bandara (Pulang)', keyPath: 'taxiBandara.filePulang' },
          { key: `sppd_tol_${noSppd}_${nip}`, label: 'Biaya Tol', keyPath: 'biayaTol.file' },
          { key: `sppd_representatif_${noSppd}_${nip}`, label: 'Biaya Representatif', keyPath: 'biayaRepresentatif.file' }
        ];

        const { data: listData, error: listError } = await sb.storage.from('sppd-documents').list('', {
          search: noSppd
        });

        if (listError || !listData) {
          setServerFiles([]);
          return;
        }

        const loadedFiles: typeof serverFiles = [];
        
        for (const fileDef of expectedFiles) {
          const found = listData.find(f => f.name === fileDef.key);
          if (found && found.id) {
            const { data: urlData } = await sb.storage.from('sppd-documents').createSignedUrl(fileDef.key, 3600);
            if (urlData?.signedUrl) {
              loadedFiles.push({
                label: fileDef.label,
                url: urlData.signedUrl,
                name: fileDef.key,
                keyPath: fileDef.keyPath
              });
            }
          }
        }
        
        setServerFiles(loadedFiles);
      } catch (err) {
        console.error('Error loading server files', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadServerFiles();
  }, [isOpen, sppdData?.noSppd, pelaksana?.nip]);

  if (!isOpen || !rincianData) return null;

  // Extract all files from rincianData (recently uploaded)
  const localFiles: { label: string; file: File; keyPath: string }[] = [];

  if (rincianData.kwitansiFile) localFiles.push({ label: 'Kwitansi Perjalanan Dinas', file: rincianData.kwitansiFile, keyPath: 'kwitansiFile' });
  if (rincianData.rincianFile) localFiles.push({ label: 'Rincian Perjalanan Dinas', file: rincianData.rincianFile, keyPath: 'rincianFile' });
  if (rincianData.sppdVisumFile) localFiles.push({ label: 'SPPD Visum', file: rincianData.sppdVisumFile, keyPath: 'sppdVisumFile' });
  if (rincianData.hotelFile) localFiles.push({ label: 'Bill Hotel', file: rincianData.hotelFile, keyPath: 'hotelFile' });
  if (rincianData.sewaKendaraan?.file) localFiles.push({ label: 'Sewa Kendaraan', file: rincianData.sewaKendaraan.file, keyPath: 'sewaKendaraan.file' });
  if (rincianData.pesawat?.filePergi) localFiles.push({ label: 'Tiket Pesawat (Pergi)', file: rincianData.pesawat.filePergi, keyPath: 'pesawat.filePergi' });
  if (rincianData.pesawat?.filePulang) localFiles.push({ label: 'Tiket Pesawat (Pulang)', file: rincianData.pesawat.filePulang, keyPath: 'pesawat.filePulang' });
  if (rincianData.keretaApi?.file) localFiles.push({ label: 'Tiket Kereta Api', file: rincianData.keretaApi.file, keyPath: 'keretaApi.file' });
  if (rincianData.biayaTol?.file) localFiles.push({ label: 'Biaya Tol', file: rincianData.biayaTol.file, keyPath: 'biayaTol.file' });
  if (rincianData.taxiBandara?.filePergi) localFiles.push({ label: 'Taxi Bandara (Pergi)', file: rincianData.taxiBandara.filePergi, keyPath: 'taxiBandara.filePergi' });
  if (rincianData.taxiBandara?.filePulang) localFiles.push({ label: 'Taxi Bandara (Pulang)', file: rincianData.taxiBandara.filePulang, keyPath: 'taxiBandara.filePulang' });
  if (rincianData.biayaRepresentatif?.file) localFiles.push({ label: 'Biaya Representatif', file: rincianData.biayaRepresentatif.file, keyPath: 'biayaRepresentatif.file' });

  // Merge server files and local files (local overrides server)
  const combinedFiles = [...serverFiles.map(sf => ({ ...sf, isLocal: false }))];
  
  localFiles.forEach(lf => {
    const existingIdx = combinedFiles.findIndex(cf => cf.keyPath === lf.keyPath);
    const item = { label: lf.label, file: lf.file, name: lf.file.name, keyPath: lf.keyPath, isLocal: true, url: '' };
    if (existingIdx >= 0) {
      combinedFiles[existingIdx] = item;
    } else {
      combinedFiles.push(item);
    }
  });

  const handleOpenDokumen = (item: any) => {
    if (item.isLocal && item.file) {
      const url = URL.createObjectURL(item.file);
      window.open(url, '_blank');
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#191c1e]/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-[#00475e]">Dokumen Pendukung</h2>
            <p className="text-xs text-slate-500 mt-1">Daftar file yang diunggah oleh {pelaksana?.nama}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Upload Section */}
        {isEditable && (
          <div className="px-6 py-4 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold text-[#00475e] mb-3">Upload Dokumen Tambahan</h3>
            <div className="flex flex-wrap gap-3">
              <input 
                type="file" 
                ref={kwitansiRef} 
                className="hidden" 
                onChange={(e) => { 
                  if (e.target.files?.[0]) onUploadFile('kwitansiFile', e.target.files[0]) 
                }} 
              />
              <button 
                onClick={() => kwitansiRef.current?.click()} 
                className="px-4 py-2 bg-[#00475e] text-white text-xs font-bold rounded-lg hover:bg-[#00384a] inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" /> 
                Upload Kwitansi Perjalanan Dinas
              </button>

              <input 
                type="file" 
                ref={rincianRef} 
                className="hidden" 
                onChange={(e) => { 
                  if (e.target.files?.[0]) onUploadFile('rincianFile', e.target.files[0]) 
                }} 
              />
              <button 
                onClick={() => rincianRef.current?.click()} 
                className="px-4 py-2 bg-[#00475e] text-white text-xs font-bold rounded-lg hover:bg-[#00384a] inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" /> 
                Upload Rincian Perjalanan Dinas
              </button>

              <input 
                type="file" 
                ref={sppdVisumRef} 
                className="hidden" 
                onChange={(e) => { 
                  if (e.target.files?.[0]) onUploadFile('sppdVisumFile', e.target.files[0]) 
                }} 
              />
              <button 
                onClick={() => sppdVisumRef.current?.click()} 
                className="px-4 py-2 bg-[#00475e] text-white text-xs font-bold rounded-lg hover:bg-[#00384a] inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" /> 
                Upload SPPD Visum
              </button>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00475e] animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-600">Memuat dokumen dari server...</p>
            </div>
          ) : combinedFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Tidak ada dokumen yang diunggah</p>
            </div>
          ) : (
            <div className="space-y-3">
              {combinedFiles.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-[#00475e]/10 rounded-lg shrink-0">
                      <FileText className="w-5 h-5 text-[#00475e]" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditable && (
                      <div className="relative">
                        <input 
                          type="file" 
                          id={`reupload-${idx}`}
                          className="hidden" 
                          onChange={(e) => { 
                            if (e.target.files?.[0]) onUploadFile(item.keyPath, e.target.files[0]) 
                          }} 
                        />
                        <label 
                          htmlFor={`reupload-${idx}`}
                          className="shrink-0 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Ulang
                        </label>
                      </div>
                    )}
                    <button 
                      onClick={() => handleOpenDokumen(item)}
                      className="shrink-0 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Buka File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
