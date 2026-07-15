import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ActivityFeed } from '../components/ActivityFeed';
import { KPICard } from '../components/KPICard';
import { Eye, Timer, CheckCircle } from 'lucide-react';

export default function DashboardPegawai() {
  const kpiData = [
    {
      icon: Eye,
      value: '12',
      label: 'Pengajuan Masuk',
      bgColor: 'bg-[#c0e8ff]',
      iconColor: 'text-[#00475e]',
      hoverColor: 'group-hover:text-[#00475e]'
    },
    {
      icon: Timer,
      value: '4',
      label: 'Menunggu Persetujuan',
      bgColor: 'bg-[#ffddbb]',
      iconColor: 'text-[#5f3800]',
      hoverColor: 'group-hover:text-[#5f3800]'
    },
    {
      icon: CheckCircle,
      value: '8',
      label: 'Disetujui',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      hoverColor: 'group-hover:text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Header />
      <Sidebar />

      <main className="ml-64 pt-20 p-8 min-h-screen">
        <header className="mb-10">
          <p className="text-[#4c616d] font-semibold uppercase tracking-[0.15em] text-[10px] mb-2">Selamat Datang</p>
          <h2 className="text-4xl font-bold tracking-tight text-[#00475e] mb-1">Dashboard Pegawai</h2>
          <p className="text-[#40484d] max-w-2xl">
            Pantau dan verifikasi pengajuan perjalanan dinas di lingkungan bidang Anda.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="space-y-8">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
}
