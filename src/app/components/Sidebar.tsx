import { Building2, LayoutDashboard, FileText, ClipboardCheck, LogOut, Archive } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { getSupabaseClient } from '../utils/supabaseClient';

export function Sidebar() {
  const location = useLocation();
  
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  
  let menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
  ];

  if (user?.role === 'kpa') {
    menuItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/persetujuan-sppd', icon: FileText, label: 'Persetujuan SPPD' },
      { path: '/pegawai/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Pegawai)' },
      { path: '/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (KPA)' },
      { path: '/arsip-spj', icon: Archive, label: 'Arsip Laporan (SPJ)' },
    ];
  } else if (user?.role === 'pengelola') {
    menuItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pengajuan', icon: FileText, label: 'Pengajuan' },
      { path: '/daftar-pengajuan', icon: FileText, label: 'Daftar Pengajuan' },
      { path: '/laporan', icon: ClipboardCheck, label: 'Laporan (SPJ)' },
      { path: '/pegawai/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Pegawai)' },
      { path: '/arsip-spj-pengelola', icon: Archive, label: 'Arsip Laporan (SPJ)' },
    ];
  } else if (user?.role === 'pegawai') {
    menuItems = [
      { path: '/pegawai/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ' },
      { path: '/pegawai/arsip-spj', icon: Archive, label: 'Arsip Laporan (SPJ)' },
    ];
  } else if (user?.role === 'pptk') {
    menuItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pegawai/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Pegawai)' },
      { path: '/pptk/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (PPTK)' },
      { path: '/pptk/arsip-spj', icon: Archive, label: 'Arsip Laporan (SPJ)' },
    ];
  } else if (user?.role === 'bendahara') {
    menuItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pegawai/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Pegawai)' },
      { path: '/bendahara/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Bendahara)' },
      { path: '/bendahara/arsip-spj', icon: Archive, label: 'Arsip Laporan (SPJ)' },
    ];
  } else if (user?.role === 'admin') {
    menuItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/daftar-pengajuan', icon: FileText, label: 'Daftar Pengajuan (Semua)' },
      { path: '/persetujuan-sppd', icon: FileText, label: 'Persetujuan SPPD (Semua)' },
      { path: '/persetujuan-spj', icon: ClipboardCheck, label: 'Persetujuan SPJ (Semua)' },
      { path: '/laporan', icon: ClipboardCheck, label: 'Laporan SPJ (Semua)' },
      { path: '/arsip-spj', icon: Archive, label: 'Arsip Laporan (Semua)' },
    ];
  }

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col p-4 pt-20 bg-slate-50 w-64 z-40">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#00475e] flex items-center justify-center text-white">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-black text-[#164e63] leading-tight uppercase text-xs tracking-wider">Diskoperindag</h2>
          <p className="text-[10px] text-slate-500 font-medium">Kabupaten Berau</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out font-medium text-sm ${
                isActive
                  ? 'bg-white text-[#0e7490] shadow-sm'
                  : 'text-slate-600 hover:text-[#0891b2] hover:bg-white/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-200">
        <button
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin keluar?')) {
              getSupabaseClient().auth.signOut().catch(console.error);
              localStorage.removeItem('user');
              localStorage.removeItem('offline_mode');
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/20 rounded-lg transition-all duration-200 ease-in-out font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}