import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BudgetDialog, BudgetData } from '../components/BudgetDialog';
import { Wallet, TrendingUp, TrendingDown, Plus, Edit2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { apiRequest } from '../utils/supabaseClient';

interface AnggaranInfo { total: number; used: number; }

function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export default function Anggaran() {
  const [dalamDaerah, setDalamDaerah] = useState<AnggaranInfo>({ total: 600_000_000, used: 450_000_000 });
  const [luarDaerah, setLuarDaerah] = useState<AnggaranInfo>({ total: 2_000_000_000, used: 840_000_000 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add'>('edit');
  const [editType, setEditType] = useState<'Dalam Daerah' | 'Luar Daerah'>('Dalam Daerah');

  useEffect(() => {
    apiRequest<{ dalamDaerah: AnggaranInfo; luarDaerah: AnggaranInfo }>('/anggaran')
      .then(res => { setDalamDaerah(res.dalamDaerah); setLuarDaerah(res.luarDaerah); })
      .catch(() => {});
  }, []);

  const handleSave = async (data: BudgetData) => {
    if (data.type === 'Dalam Daerah') setDalamDaerah({ total: data.total, used: data.used });
    else setLuarDaerah({ total: data.total, used: data.used });
    try {
      await apiRequest('/anggaran', { method: 'PUT', body: JSON.stringify({ type: data.type, total: data.total, used: data.used }) });
      toast.success('Data anggaran berhasil disimpan');
    } catch { toast.error('Gagal menyimpan (mode offline)'); }
  };

  const openEdit = (type: 'Dalam Daerah' | 'Luar Daerah') => {
    setEditType(type); setDialogMode('edit'); setIsDialogOpen(true);
  };

  const cards = [
    { label: 'Dalam Daerah', type: 'Dalam Daerah' as const, data: dalamDaerah, color: '#00475e', light: '#c0e8ff' },
    { label: 'Luar Daerah',  type: 'Luar Daerah'  as const, data: luarDaerah,  color: '#5f3800', light: '#ffddbb' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />
      <main className="ml-64 pt-24 pb-16 px-8">
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#00475e] tracking-tight">Data Anggaran</h2>
              <p className="text-[#40484d] mt-1">Alokasi dan realisasi anggaran perjalanan dinas tahun berjalan.</p>
            </div>
            <button
              onClick={() => { setDialogMode('add'); setEditType('Dalam Daerah'); setIsDialogOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00475e] text-white rounded-xl text-sm font-bold hover:bg-[#00384a] transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Anggaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map(({ label, type, data, color, light }) => {
              const pct = data.total > 0 ? Math.round((data.used / data.total) * 100) : 0;
              const sisa = data.total - data.used;
              return (
                <div key={type} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: light }}>
                        <Wallet className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perjalanan Dinas</p>
                        <p className="font-bold text-[#191c1e]">{label}</p>
                      </div>
                    </div>
                    <button onClick={() => openEdit(type)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Realisasi</span><span>{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 80 ? '#ba1a1a' : color }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[['Total Anggaran', data.total, TrendingUp, color], ['Terpakai', data.used, TrendingDown, pct > 80 ? '#ba1a1a' : '#5f3800'], ['Sisa', sisa, Wallet, sisa < 0 ? '#ba1a1a' : '#1d6f42']].map(([lbl, val, Icon, c]: any) => (
                      <div key={lbl} className="bg-slate-50 rounded-xl p-3">
                        <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: c }} />
                        <p className="text-xs font-bold" style={{ color: c }}>{fmt(val)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BudgetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        initialData={{ year: '2024', type: editType, total: editType === 'Dalam Daerah' ? dalamDaerah.total : luarDaerah.total, used: editType === 'Dalam Daerah' ? dalamDaerah.used : luarDaerah.used }}
        mode={dialogMode}
      />
    </div>
  );
}
