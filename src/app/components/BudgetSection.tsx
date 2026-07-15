import { Plus } from 'lucide-react';

interface BudgetSectionProps {
  dalamDaerahTotal: number;
  dalamDaerahUsed: number;
  luarDaerahTotal: number;
  luarDaerahUsed: number;
  onEditClick?: () => void;
  onAddClick?: () => void;
}

export function BudgetSection({ 
  dalamDaerahTotal, 
  dalamDaerahUsed, 
  luarDaerahTotal, 
  luarDaerahUsed,
  onEditClick,
  onAddClick
}: BudgetSectionProps) {
  const dalamDaerahPercentage = Math.round((dalamDaerahUsed / dalamDaerahTotal) * 100);
  const luarDaerahPercentage = Math.round((luarDaerahUsed / luarDaerahTotal) * 100);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(0)}jt`;
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <section className="bg-[#f2f4f6] p-8 rounded-xl border border-slate-200/10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#00475e]">Data Anggaran 2024</h3>
          <p className="text-sm text-[#40484d]">Ringkasan penyerapan dana perjalanan dinas.</p>
        </div>
        <div className="flex gap-2">
          {onEditClick && (
            <button 
              onClick={onEditClick}
              className="px-4 py-2 bg-white text-[#191c1e] text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          )}
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="px-4 py-2 bg-gradient-to-br from-[#00475e] to-[#1a5f7a] text-white text-sm font-semibold rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Anggaran
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dalam Daerah */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-[#191c1e]">Dalam Daerah</span>
            <span className="text-xs text-[#4c616d] font-medium">Realisasi: {dalamDaerahPercentage}%</span>
          </div>
          <div className="h-10 bg-[#e0e3e5] rounded-full overflow-hidden flex p-1">
            <div 
              className="h-full bg-[#00475e] rounded-full transition-all duration-1000" 
              style={{ width: `${dalamDaerahPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-[#70787d]">
            <span>{formatCurrency(dalamDaerahUsed)}</span>
            <span>Target: {formatCurrency(dalamDaerahTotal)}</span>
          </div>
        </div>
        {/* Luar Daerah */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm font-bold text-[#191c1e]">Luar Daerah</span>
            <span className="text-xs text-[#4c616d] font-medium">Realisasi: {luarDaerahPercentage}%</span>
          </div>
          <div className="h-10 bg-[#e0e3e5] rounded-full overflow-hidden flex p-1">
            <div 
              className="h-full bg-[#5f3800] rounded-full transition-all duration-1000" 
              style={{ width: `${luarDaerahPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-[#70787d]">
            <span>{formatCurrency(luarDaerahUsed)}</span>
            <span>Target: {formatCurrency(luarDaerahTotal)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}