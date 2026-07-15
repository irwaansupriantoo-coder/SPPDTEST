import React, { useRef } from 'react';
import { X, FileText, Download, Upload } from 'lucide-react';

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rincianData: any;
  pelaksana: any;
  onUploadFile: (key: string, file: File) => void;
  isEditable?: boolean;
}

export function DocumentViewerDialog({ isOpen, onClose, rincianData, pelaksana, onUploadFile, isEditable = true }: DocumentViewerDialogProps) {
  const kwitansiRef = useRef<HTMLInputElement>(null);
  const rincianRef = useRef<HTMLInputElement>(null);
  const sppdVisumRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !rincianData) return null;

  // Extract all files from rincianData
  const files: { label: string; file: File; keyPath: string }[] = [];

  if (rincianData.kwitansiFile) files.push({ label: 'Kwitansi Perjalanan Dinas', file: rincianData.kwitansiFile, keyPath: 'kwitansiFile' });
  if (rincianData.rincianFile) files.push({ label: 'Rincian Perjalanan Dinas', file: rincianData.rincianFile, keyPath: 'rincianFile' });
  if (rincianData.sppdVisumFile) files.push({ label: 'SPPD Visum', file: rincianData.sppdVisumFile, keyPath: 'sppdVisumFile' });
  
  if (rincianData.hotelFile) files.push({ label: 'Bill Hotel', file: rincianData.hotelFile, keyPath: 'hotelFile' });
  
  if (rincianData.sewaKendaraan?.file) files.push({ label: 'Sewa Kendaraan', file: rincianData.sewaKendaraan.file, keyPath: 'sewaKendaraan.file' });
  
  if (rincianData.pesawat?.filePergi) files.push({ label: 'Tiket Pesawat (Pergi)', file: rincianData.pesawat.filePergi, keyPath: 'pesawat.filePergi' });
  if (rincianData.pesawat?.filePulang) files.push({ label: 'Tiket Pesawat (Pulang)', file: rincianData.pesawat.filePulang, keyPath: 'pesawat.filePulang' });
  
  if (rincianData.keretaApi?.file) files.push({ label: 'Tiket Kereta Api', file: rincianData.keretaApi.file, keyPath: 'keretaApi.file' });
  if (rincianData.biayaTol?.file) files.push({ label: 'Biaya Tol', file: rincianData.biayaTol.file, keyPath: 'biayaTol.file' });
  
  if (rincianData.taxiBandara?.filePergi) files.push({ label: 'Taxi Bandara (Pergi)', file: rincianData.taxiBandara.filePergi, keyPath: 'taxiBandara.filePergi' });
  if (rincianData.taxiBandara?.filePulang) files.push({ label: 'Taxi Bandara (Pulang)', file: rincianData.taxiBandara.filePulang, keyPath: 'taxiBandara.filePulang' });
  
  if (rincianData.biayaRepresentatif?.file) files.push({ label: 'Biaya Representatif', file: rincianData.biayaRepresentatif.file, keyPath: 'biayaRepresentatif.file' });

  const handleOpenDokumen = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
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
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Tidak ada dokumen yang diunggah</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-[#00475e]/10 rounded-lg shrink-0">
                      <FileText className="w-5 h-5 text-[#00475e]" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.file.name}</p>
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
                      onClick={() => handleOpenDokumen(item.file)}
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
