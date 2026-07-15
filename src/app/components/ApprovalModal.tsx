import React, { useState } from 'react';
import { X, Eye, CheckCircle, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SppdPreviewModal } from './SppdPreviewModal';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (noSppd: string) => void;
  onReject: (noSppd: string) => void;
  data: any;
}

export function ApprovalModal({ isOpen, onClose, onApprove, onReject, data }: ApprovalModalProps) {
  const [checkedItems, setCheckedItems] = useState({
    spt: false,
    dasarSurat: false,
    drafSppd: false
  });

  const [previewFile, setPreviewFile] = useState<{ url: string, title: string } | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !data) return null;

  const isAllChecked = checkedItems.spt && checkedItems.dasarSurat && checkedItems.drafSppd;

  const toggleCheck = (key: keyof typeof checkedItems) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openFile = (url?: string, title: string = 'Pratinjau File') => {
    if (url) {
      setPreviewFile({ url, title });
    } else {
      alert('File tidak tersedia');
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Verifikasi Pengajuan SPPD</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Info Pegawai */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 flex items-center gap-5 mb-6">
                <div className="w-14 h-14 bg-[#002b49] rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-0.5">Informasi Pegawai</p>
                  <h3 className="text-2xl font-bold text-slate-800">{data?.pembuat?.nama || 'Nama Pegawai'}</h3>
                  <p className="text-sm text-slate-500">NIP. {data?.pembuat?.nip || '-'}</p>
                </div>
              </div>

              <p className="text-slate-600 mb-4">
                Silakan periksa kelengkapan dokumen pengajuan SPPD berikut sebelum memberikan persetujuan.
              </p>

              {/* Document List */}
              <div className="space-y-3">
                {/* Item 1 */}
                <div className="border border-slate-200 rounded-lg p-4 flex items-center gap-4 bg-white">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-[#00475e] focus:ring-[#00475e] bg-slate-50 cursor-pointer"
                    checked={checkedItems.spt}
                    onChange={() => toggleCheck('spt')}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Dokumen SPT</p>
                    <p className="text-xs text-slate-500 font-medium">Surat Perintah Tugas resmi</p>
                  </div>
                  <button 
                    onClick={() => openFile(data?.sptFileUrl, 'Dokumen SPT')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#00475e] transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Lihat File
                  </button>
                </div>

                {/* Item 2 */}
                <div className="border border-slate-200 rounded-lg p-4 flex items-center gap-4 bg-white">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-[#00475e] focus:ring-[#00475e] bg-slate-50 cursor-pointer"
                    checked={checkedItems.dasarSurat}
                    onChange={() => toggleCheck('dasarSurat')}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Dasar Surat / Telaahan Staf</p>
                    <p className="text-xs text-slate-500 font-medium">Dokumen pendukung alasan keberangkatan</p>
                  </div>
                  <button 
                    onClick={() => openFile(data?.dasarSuratFileUrl, 'Dasar Surat / Telaahan Staf')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#00475e] transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Lihat File
                  </button>
                </div>

                {/* Item 3 */}
                <div className="border border-slate-200 rounded-lg p-4 flex items-center gap-4 bg-white">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-[#00475e] focus:ring-[#00475e] bg-slate-50 cursor-pointer"
                    checked={checkedItems.drafSppd}
                    onChange={() => toggleCheck('drafSppd')}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Draf SPPD</p>
                    <p className="text-xs text-slate-500 font-medium">Surat Perjalanan Dinas yang akan disetujui</p>
                  </div>
                  <button 
                    onClick={() => setShowDraft(true)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#00475e] transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Lihat File
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  if (isAllChecked) setShowConfirm(true);
                }}
                disabled={!isAllChecked}
                className={`px-6 py-2.5 rounded text-sm font-bold transition-colors flex items-center gap-2 ${
                  isAllChecked 
                    ? "bg-[#fde047] text-slate-800 hover:bg-[#facc15]" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Setujui Pengajuan
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setPreviewFile(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Pratinjau: {previewFile.title}</h2>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 bg-slate-100 p-4">
                <iframe
                  src={previewFile.url}
                  className="w-full h-full rounded-lg shadow-sm bg-white"
                  title={previewFile.title}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sppd Draft Preview Modal */}
      <SppdPreviewModal 
        isOpen={showDraft} 
        onClose={() => setShowDraft(false)} 
        data={data} 
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setShowConfirm(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Persetujuan</h3>
              <p className="text-sm text-slate-600 mb-6">
                Apakah Anda yakin ingin menyetujui pengajuan SPPD ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setShowConfirm(false);
                    onApprove(data.noSppd);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-[#00475e] text-white hover:bg-[#00384a] transition-colors"
                >
                  Ya, Setujui
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
