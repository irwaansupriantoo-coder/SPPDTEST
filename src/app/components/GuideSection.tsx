import { BookOpen, ArrowRight } from 'lucide-react';

export function GuideSection() {
  return (
    <section className="bg-white p-8 rounded-xl relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#ffddbb] text-[#5f3800] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#191c1e]">Panduan Penggunaan Sistem</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[#f7f9fb] rounded-lg border-l-4 border-[#00475e]">
            <span className="text-2xl font-black text-[#c0c8cd] block mb-2">01</span>
            <h4 className="font-bold text-sm mb-1">Input Data</h4>
            <p className="text-xs text-[#40484d] leading-relaxed">Masukkan detail perjalanan, tujuan, dan lampirkan dokumen pendukung awal.</p>
          </div>
          <div className="p-4 bg-[#f7f9fb] rounded-lg border-l-4 border-[#5f3800]">
            <span className="text-2xl font-black text-[#c0c8cd] block mb-2">02</span>
            <h4 className="font-bold text-sm mb-1">Verifikasi</h4>
            <p className="text-xs text-[#40484d] leading-relaxed">Admin akan memeriksa kelengkapan berkas dan ketersediaan anggaran daerah.</p>
          </div>
          <div className="p-4 bg-[#f7f9fb] rounded-lg border-l-4 border-[#4c616d]">
            <span className="text-2xl font-black text-[#c0c8cd] block mb-2">03</span>
            <h4 className="font-bold text-sm mb-1">Pelaporan</h4>
            <p className="text-xs text-[#40484d] leading-relaxed">Setelah kembali, unggah SPJ dan kuitansi asli untuk penyelesaian dana.</p>
          </div>
        </div>
        <button className="mt-8 text-[#00475e] font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          Lihat Selengkapnya
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
