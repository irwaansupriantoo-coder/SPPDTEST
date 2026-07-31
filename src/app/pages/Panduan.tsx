import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { GuideSection } from '../components/GuideSection';

export default function Panduan() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Header />
      <Sidebar />
      <main className="w-full lg:w-[calc(100%-16rem)] lg:ml-64 pt-24 pb-16 px-4 lg:px-8 transition-all duration-300">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-[#00475e] tracking-tight">Panduan Penggunaan</h2>
            <p className="text-[#40484d] mt-1">Tata cara pengajuan dan pelaporan perjalanan dinas.</p>
          </div>
          <GuideSection />
        </div>
      </main>
    </div>
  );
}
