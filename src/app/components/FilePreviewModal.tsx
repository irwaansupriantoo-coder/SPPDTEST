import React, { useEffect, useState } from 'react';
import { X, Loader2, Download } from 'lucide-react';
import { getFile } from '../utils/fileStore';
import { get } from 'idb-keyval';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileKey: string;
  title: string;
}

export function FilePreviewModal({ isOpen, onClose, fileKey, title }: FilePreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFileUrl(null);
      setIsLoading(true);
      setError(null);
      return;
    }

    let url: string | null = null;

    const loadFile = async () => {
      try {
        let file: any = await getFile(fileKey);
        // Files are strictly fetched from Supabase now.
        if (!file) {
          setError('Dokumen belum diunggah.');
        } else if (typeof file === 'string') {
          setFileUrl(file);
        } else if (file instanceof Blob || file instanceof File) {
          url = URL.createObjectURL(file);
          setFileUrl(url);
        } else {
          setError('Format file tidak didukung.');
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat dokumen.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();

    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, fileKey]);

  if (!isOpen) return null;

  const isPdf = fileUrl?.startsWith('data:application/pdf') || fileUrl?.startsWith('blob:'); // Blob could be anything, but we usually upload PDF/Images. We'll use an iframe which handles both well.

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#191c1e]/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/20">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f2f4f6] border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-[#00475e]">{title}</h3>
          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                download={title}
                className="p-2 text-slate-500 hover:text-[#00475e] hover:bg-slate-200 rounded-lg transition-colors"
                title="Unduh Dokumen"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Memuat dokumen...</p>
            </div>
          )}

          {error && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8" />
              </div>
              <p className="text-slate-600 font-medium">{error}</p>
            </div>
          )}

          {fileUrl && !isLoading && !error && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-none"
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
