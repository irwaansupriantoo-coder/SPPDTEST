import { useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { User, Lock, Bell, Database, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { apiRequest } from '../utils/supabaseClient';

import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function Pengaturan() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheckDb = async () => {
    setChecking(true);
    try {
      const res = await apiRequest<{ tables: Record<string, boolean>; allExist: boolean; message: string }>('/setup-db', { method: 'POST' });
      setDbStatus(res.message);
      if (res.allExist) toast.success('Semua tabel database aktif');
      else toast.warning('Beberapa tabel belum ada â€” jalankan migration SQL');
    } catch {
      setDbStatus('Server tidak dapat dijangkau. Edge Function belum di-deploy.');
      toast.error('Tidak dapat menghubungi server');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar?')) {
      await getSupabaseClient().auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />
      <main className="w-full lg:w-[calc(100%-16rem)] lg:ml-64 pt-24 pb-16 px-4 lg:px-8 transition-all duration-300">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-[#00475e] tracking-tight">Pengaturan</h2>
            <p className="text-[#40484d] mt-1">Konfigurasi akun dan sistem.</p>
          </div>

          {/* Profil */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-[#00475e] flex items-center gap-2"><User className="w-4 h-4" /> Profil Akun</h3>
            <div className="grid grid-cols-2 gap-4">
              {[['Nama', user?.nama ?? '-'], ['NIP', user?.nip ?? '-'], ['Role', user?.role ?? 'pegawai'], ['Mode', 'Online']].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{k}</p>
                  <p className="font-bold text-[#191c1e] mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Database */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-[#00475e] flex items-center gap-2"><Database className="w-4 h-4" /> Status Database</h3>
            {dbStatus && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{dbStatus}</p>
            )}
            <button
              onClick={handleCheckDb}
              disabled={checking}
              className="px-4 py-2.5 bg-[#00475e] text-white rounded-xl text-sm font-bold hover:bg-[#00384a] transition-colors disabled:opacity-60"
            >
              {checking ? 'Memeriksa...' : 'Periksa Status Tabel'}
            </button>
            <p className="text-xs text-slate-400">
              Untuk membuat tabel, jalankan file <code className="bg-slate-100 px-1 rounded">supabase/migrations/20240101000000_init.sql</code> di Supabase SQL Editor.
            </p>
          </div>

          {/* Keamanan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-[#00475e] flex items-center gap-2"><Lock className="w-4 h-4" /> Keamanan</h3>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-sm font-bold hover:bg-[#ffb4ab] transition-colors"
            >
              Keluar dari Sistem
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
