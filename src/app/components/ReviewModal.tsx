import { X, ArrowLeft, Printer, Send, Car, Plane, Ship, ArrowRight, Info } from 'lucide-react';

interface PelaksanaData {
  nama: string;
  nip: string;
  pangkat: string;
  jabatan: string;
  alatAngkut: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onSubmit?: () => void;
  data: {
    keperluan: string;
    tempatBerangkat: string;
    tempatTujuan: string;
    tanggalPergi: string;
    tanggalKembali: string;
    tipePerjalanan: string;
    alatAngkut: string;
    pelaksana: PelaksanaData[];
  };
  isSubmitting?: boolean;
}

export function ReviewModal({ isOpen, onClose, onPrint, onSubmit, data, isSubmitting }: ReviewModalProps) {
  if (!isOpen) return null;

  // Calculate duration in days
  const calculateDuration = () => {
    const start = new Date(data.tanggalPergi);
    const end = new Date(data.tanggalKembali);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const duration = calculateDuration();
  const dailyRate = data.tipePerjalanan === 'Luar Daerah' ? 430000 : 170000;
  const perPersonTotal = dailyRate * duration;
  const totalBudget = perPersonTotal * data.pelaksana.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getTransportIcon = (transport: string) => {
    if (transport.includes('Darat') || transport.includes('Kendaraan')) {
      return <Car className="w-5 h-5 text-[#00475e]" />;
    } else if (transport.includes('Udara') || transport.includes('Pesawat')) {
      return <Plane className="w-5 h-5 text-[#00475e]" />;
    } else if (transport.includes('Laut')) {
      return <Ship className="w-5 h-5 text-[#00475e]" />;
    }
    return <Car className="w-5 h-5 text-[#00475e]" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1e]/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[95vw] lg:max-w-7xl max-h-[95vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 flex justify-between items-center bg-white border-b border-[#e0e3e5]">
          <div>
            <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">Review Rincian Pengajuan</h2>
            <p className="text-sm text-[#4c616d]">Verifikasi data personil dan rincian perjalanan sebelum submit.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#4c616d] hover:text-[#191c1e] transition-colors p-2 rounded-full hover:bg-[#f2f4f6]"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f2f4f6]">
          {/* Maksud Perjalanan */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-[#c0c8cd]/30">
            <h3 className="text-[10px] font-bold text-[#00475e] uppercase tracking-widest mb-3">Maksud Perjalanan</h3>
            <p className="text-[#191c1e] text-lg font-medium leading-relaxed">
              {data.keperluan}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-[#c0c8cd]/30">
            <div className="min-w-[1200px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#c0c8cd]/30">
                  <tr>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Nama / NIP</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Pangkat/Gol</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Jabatan</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Alat Angkut</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Tipe</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Rute</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Durasi</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest">Jadwal</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-[#00475e] uppercase tracking-widest text-right">Est. Uang Harian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c8cd]/20">
                  {data.pelaksana.map((person, index) => (
                    <tr key={index} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-4 py-5">
                        <div className="font-bold text-[#191c1e]">{person.nama}</div>
                        <div className="text-[11px] text-[#4c616d]">{person.nip}</div>
                      </td>
                      <td className="px-4 py-5 text-sm text-[#40484d]">{person.pangkat}</td>
                      <td className="px-4 py-5 text-sm text-[#40484d]">{person.jabatan}</td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          {getTransportIcon(data.alatAngkut)}
                          <span className="text-sm">{data.alatAngkut}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded uppercase">
                          {data.tipePerjalanan}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#4c616d]"></span> {data.tempatBerangkat}
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-[#00475e]">
                            <ArrowRight className="w-3 h-3" /> {data.tempatTujuan}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm font-medium">{duration} Hari</td>
                      <td className="px-4 py-5">
                        <div className="text-xs">
                          <div className="text-[#191c1e]">{formatDate(data.tanggalPergi)}</div>
                          <div className="text-[#4c616d]">s/d {formatDate(data.tanggalKembali)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <div className="font-bold text-[#00475e]">Rp {perPersonTotal.toLocaleString('id-ID')}</div>
                        <div className="text-[9px] text-[#4c616d] mt-1 tracking-tight">
                          {dailyRate.toLocaleString('id-ID')} x {duration} hari
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info and Total */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 p-5 bg-amber-50/50 rounded-xl border border-amber-200/50 flex gap-3">
              <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Estimasi uang harian dihitung berdasarkan standar biaya masukan (SBM) yang berlaku untuk kategori perjalanan <strong>{data.tipePerjalanan}</strong> (Rp {dailyRate.toLocaleString('id-ID')}/hari). Pastikan rute, durasi, dan personil sudah sesuai dengan surat tugas sebelum melakukan submit.
              </p>
            </div>
            <div className="lg:w-80 p-5 bg-[#00475e] rounded-xl shadow-xl text-white flex flex-col justify-center">
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Total Anggaran Personel</div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium opacity-80">Rp</span>
                <span className="text-3xl font-black">{totalBudget.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[10px] font-medium text-white/60 mt-1">
                {data.pelaksana.length} Personil x Rp {perPersonTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 bg-white flex flex-col sm:flex-row justify-between items-center border-t border-[#e0e3e5] gap-4">
          <button
            onClick={onClose}
            className="text-[#4c616d] font-semibold px-4 py-2 hover:text-[#191c1e] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali Edit
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 bg-[#00475e] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-[#1a5f7a] transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {isSubmitting ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Memproses...' : 'Submit Pengajuan'}
          </button>
        </footer>
      </div>
    </div>
  );
}