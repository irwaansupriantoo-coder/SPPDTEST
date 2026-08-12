import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface BayarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (buktiFile: File, tbpFile: File) => void;
  data: any;
}

export function BayarDialog({ isOpen, onClose, onConfirm, data }: BayarDialogProps) {
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [tbpFile, setTbpFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const tbpRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!buktiFile) {
      toast.error('Mohon unggah bukti pembayaran atau pindah buku terlebih dahulu');
      return;
    }
    if (!tbpFile) {
      toast.error('Mohon unggah Tanda Bukti Pembayaran (TBP) terlebih dahulu');
      return;
    }
    onConfirm(buktiFile, tbpFile);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#191c1e]/40 backdrop-blur-md" onClick={onClose}></div>

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200/20 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Pembayaran SPJ</h2>
              <p className="text-white/80 text-xs font-medium mt-1">
                Upload bukti pembayaran untuk {data?.noSpt}
              </p>
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pembayaran</p>
                <p className="text-lg font-black text-[#191c1e]">
                  Rp {data?.totalAnggaran?.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <label className="text-sm font-bold text-[#191c1e] block mb-3">
              Bukti Pembayaran / Pindah Buku
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setBuktiFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-500/50 bg-[#f2f4f6] hover:bg-emerald-50 p-6 rounded-xl transition-all group mb-4"
            >
              {buktiFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600 tracking-tight truncate max-w-[200px]">
                    {buktiFile.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 tracking-tight">
                    Klik untuk upload dokumen
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max. 5MB)</span>
                </div>
              )}
            </button>

            <label className="text-sm font-bold text-[#191c1e] block mb-3">
              Tanda Bukti Pembayaran (TBP)
            </label>
            <input
              ref={tbpRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setTbpFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => tbpRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-500/50 bg-[#f2f4f6] hover:bg-emerald-50 p-6 rounded-xl transition-all group"
            >
              {tbpFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600 tracking-tight truncate max-w-[200px]">
                    {tbpFile.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-600 tracking-tight">
                    Klik untuk upload TBP
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max. 5MB)</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f2f4f6] shrink-0 flex items-center justify-end gap-3 shadow-inner">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent text-slate-600 hover:bg-slate-200 font-bold text-sm rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}

