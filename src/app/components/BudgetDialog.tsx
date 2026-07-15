import { X, ChevronDown, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetData) => void;
  initialData?: BudgetData;
  mode: 'edit' | 'add';
}

export interface BudgetData {
  year: string;
  type: 'Dalam Daerah' | 'Luar Daerah';
  total: number;
  used: number;
}

export function BudgetDialog({ isOpen, onClose, onSave, initialData, mode }: BudgetDialogProps) {
  const [year, setYear] = useState(initialData?.year || '2024');
  const [type, setType] = useState<'Dalam Daerah' | 'Luar Daerah'>(initialData?.type || 'Dalam Daerah');
  const [total, setTotal] = useState(initialData?.total || 0);
  const [used, setUsed] = useState(initialData?.used || 0);

  useEffect(() => {
    if (initialData) {
      setYear(initialData.year);
      setType(initialData.type);
      setTotal(initialData.total);
      setUsed(initialData.used);
    }
  }, [initialData]);

  const usedPercentage = total > 0 ? Math.round((used / total) * 100) : 0;

  const handleSave = () => {
    onSave({
      year,
      type,
      total,
      used
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#191c1e]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-[0_32px_64px_-12px_rgba(25,28,30,0.12)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#00475e] tracking-tight">
              {mode === 'edit' ? 'Edit Data Anggaran Perjalanan Dinas' : 'Kelola Data Anggaran Perjalanan Dinas'}
            </h2>
            <p className="text-xs text-[#40484d] mt-1">Konfigurasi alokasi dana perjalanan dinas operasional</p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#40484d] hover:bg-[#e6e8ea] p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          {/* Tahun Anggaran */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#4c616d] uppercase tracking-widest">
              Tahun Anggaran
            </label>
            <div className="relative">
              <select 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-[#e0e3e5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#00475e] focus:bg-[#e6e8ea] appearance-none"
              >
                <option>2024</option>
                <option>2025</option>
                <option>2026</option>
              </select>
              <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#40484d]" />
            </div>
          </div>

          {/* Jenis Perjalanan (Segmented Control) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#4c616d] uppercase tracking-widest">
              Jenis Perjalanan
            </label>
            <div className="flex p-1 bg-[#e0e3e5] rounded-xl">
              <button
                onClick={() => setType('Dalam Daerah')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'Dalam Daerah'
                    ? 'bg-white shadow-sm text-[#00475e]'
                    : 'text-[#40484d] hover:text-[#191c1e]'
                }`}
              >
                Dalam Daerah
              </button>
              <button
                onClick={() => setType('Luar Daerah')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'Luar Daerah'
                    ? 'bg-white shadow-sm text-[#00475e]'
                    : 'text-[#40484d] hover:text-[#191c1e]'
                }`}
              >
                Luar Daerah
              </button>
            </div>
          </div>

          {/* Total Anggaran */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#4c616d] uppercase tracking-widest">
              Total Anggaran (IDR)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#00475e]">
                Rp
              </div>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="w-full bg-[#e0e3e5] border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#00475e] focus:bg-[#e6e8ea]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Progress Indicator / Status Field */}
          <div className="p-4 bg-[#f2f4f6] rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-[#40484d]">Alokasi Digunakan</span>
              <span className="text-xs font-bold text-[#00475e]">{usedPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-[#e0e3e5] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1a5f7a] transition-all duration-300"
                style={{ width: `${usedPercentage}%` }}
              ></div>
            </div>
            <div className="mt-3 flex items-start text-[10px] text-[#40484d]">
              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>Berdasarkan input sebelumnya, anggaran ini masih dalam batas aman plafon tahunan.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-[#f2f4f6] flex justify-end items-center space-x-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-[#40484d] hover:text-[#191c1e] transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2.5 bg-gradient-to-br from-[#00475e] to-[#1a5f7a] text-white rounded-xl text-sm font-semibold shadow-lg active:scale-95 transition-all"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
