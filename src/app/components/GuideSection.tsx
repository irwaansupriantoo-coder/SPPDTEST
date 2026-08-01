import { BookOpen, ArrowRight } from 'lucide-react';

export function GuideSection() {
  return (
    <section className="bg-[#fff9f0] p-8 rounded-xl relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#ffddbb] text-[#5f3800] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#191c1e]">Panduan Penggunaan Sistem</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg border-l-4 border-[#0B1B32] shadow-sm">
            <span className="text-2xl font-black text-[#e2e8f0] block mb-2">01</span>
            <h4 className="font-bold text-sm mb-1 text-slate-800">Input Data</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Masukkan detail perjalanan, tujuan, dan lampirkan dokumen pendukung awal.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border-l-4 border-orange-400 shadow-sm">
            <span className="text-2xl font-black text-[#e2e8f0] block mb-2">02</span>
            <h4 className="font-bold text-sm mb-1 text-slate-800">Verifikasi</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Admin akan memeriksa kelengkapan berkas dan ketersediaan anggaran daerah.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border-l-4 border-slate-300 shadow-sm">
            <span className="text-2xl font-black text-[#e2e8f0] block mb-2">03</span>
            <h4 className="font-bold text-sm mb-1 text-slate-800">Pelaporan</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Setelah kembali, unggah SPJ dan kuitansi asli untuk penyelesaian dana.</p>
          </div>
        </div>
        <button className="mt-8 text-slate-800 font-bold text-[9px] flex items-center gap-2 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
          Lihat Selengkapnya
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  );
}
