import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { terbilang } from '../utils/terbilang';
import html2pdf from 'html2pdf.js';

interface KwitansiPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function KwitansiPreviewModal({ isOpen, onClose, data }: KwitansiPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    if (printRef.current) {
      const opt = {
        margin: 0.1,
        filename: `Kwitansi_${data.noSppd?.replace(/[^a-zA-Z0-9]/g, '_') || 'Dinas'}.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' as const }
      };
      html2pdf().set(opt).from(printRef.current).save();
    }
  };

  const formatDateId = (dateStr: string | Date) => {
    if (!dateStr || dateStr === '-') return '-';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getGolongan = (nama: string, p: any) => {
    if (p.golongan || p.pangkatGolongan || p.pangkat) return p.golongan || p.pangkatGolongan || p.pangkat;
    const n = nama.toLowerCase();
    if (n.includes("hasnawati")) return "Pembina / IVa";
    if (n.includes("masitah")) return "Penata Tingkat I / IIId";
    if (n.includes("rahmawati")) return "Penata Muda Tk. I / III.b";
    if (n.includes("trimo")) return "Pengatur Muda/Iia";
    if (n.includes("devi") || n.includes("fadli")) return "-";
    return "Penata / IIIc";
  };

  const travelersList = (data.pelaksana || []).map((p: any) => ({
    nama: p.nama,
    nip: p.nip,
    pangkatGolongan: getGolongan(p.nama, p),
    jumlahHari: p.jumlahHari || data.lamaHari || 3,
    uangHarianPerHari: 170000,
    totalUangHarian: p.totalUangHarian || ((p.jumlahHari || data.lamaHari || 3) * 170000),
    totalBiayaHotel: p.totalBiayaHotel || 0,
    totalSewaKendaraan: p.totalSewaKendaraan || 0,
  }));

  const totalKeseluruhan = travelersList.reduce((sum: number, t: any) => sum + t.totalUangHarian + t.totalBiayaHotel + t.totalSewaKendaraan, 0);
  const mainTraveler = travelersList[0] || {};
  const sppdClean = data.noSppd || '';
  
  const tahunAnggaran = new Date().getFullYear();
  let kodeRekening = '2.17.07.2.01.04.5.1.02.04.01.0003';
  if (data.subKegiatan && data.subKegiatan.includes(' - ')) {
    kodeRekening = data.subKegiatan.split(' - ')[0];
  }

  const rawSub = data.subKegiatan || '';
  let subKegiatanStr = rawSub;
  if (rawSub.includes(' - ')) {
    subKegiatanStr = rawSub.split(' - ').slice(1).join(' - ');
  }
  if (subKegiatanStr && !/^Sub Kegiatan\s/i.test(subKegiatanStr)) {
    subKegiatanStr = 'Sub Kegiatan ' + subKegiatanStr;
  }

  const words = subKegiatanStr.replace(/^Sub Kegiatan\s+/i, '').split(/\s+/);
  const initials = words
    .filter((w: string) => /^[A-Z]/.test(w) && !['dan', 'di', 'ke', 'dari', 'yang'].includes(w.toLowerCase()))
    .map((w: string) => w.charAt(0).toUpperCase())
    .join('');
  const inisialFix = initials || 'PKPPUM';
  
  let noKwitansi = '';
  if (data.noSppdList && data.noSppdList.length > 0) {
    const primarySppd = data.noSppdList[0];
    const sppdKey = `kwitansi_no_${primarySppd}`;
    noKwitansi = localStorage.getItem(sppdKey) || `05/${inisialFix}/K/${tahunAnggaran}`;
  } else {
    noKwitansi = `05/${inisialFix}/K/${tahunAnggaran}`;
  }

  let maksudText = `Belanja Perjalanan Dinas Dalam Kota. Belanja Perjalanan Dinas Dalam Daerah Kabupaten Berau Perjalanan Dinas Dalam Daerah untuk ${data.maksud || 'Melaksanakan tugas dinas'}`;
  if (data.tanggalMulai && data.tanggalSelesai) {
    maksudText += ` pada tanggal ${formatDateId(data.tanggalMulai)} sampai ${formatDateId(data.tanggalSelesai)}.`;
  }

  const isBendaharaApproved = ['menunggu_verifikasi_pptk', 'menunggu_verifikasi_kpa', 'menunggu_pembayaran', 'selesai'].includes(data.status);
  const isPPTKApproved = ['menunggu_verifikasi_kpa', 'menunggu_pembayaran', 'selesai'].includes(data.status);
  const isKPAApproved = ['menunggu_pembayaran', 'selesai'].includes(data.status);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-[#525659] w-full max-w-[1000px] max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-4 py-3 bg-[#323639] text-white border-b border-black/20 shadow-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="bg-red-500/20 p-1.5 rounded text-red-400 hover:bg-red-500/40 transition-colors" title="Cetak PDF">
              <Printer className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Kwitansi_Dinas_{sppdClean.replace(/[^a-zA-Z0-9]/g, '_')}.pdf</h3>
              <p className="text-xs text-slate-400">1/1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#525659] custom-scrollbar">
          
          {/* Paper Container */}
          <div ref={printRef} className="bg-white text-black shadow-2xl relative shrink-0 box-border border-[3px] border-black flex" style={{ fontFamily: '"Times New Roman", Times, serif', width: '950px', height: '650px' }}>
            
            {/* Left Rotated Sidebar */}
            <div className="w-[80px] shrink-0 border-r-[3px] border-black flex flex-col items-center justify-between py-6 relative">
              <div 
                className="whitespace-nowrap text-center flex flex-col items-center justify-center mt-2"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                <span className="text-[15px] font-serif tracking-tight">PEMERINTAH KABUPATEN BERAU</span>
                <span className="text-[15px] font-serif tracking-tight">DINAS KOPERASI PERINDUSTRIAN DAN PERDAGANGAN</span>
                <span className="text-[13px] font-serif tracking-tight mt-0.5">Jalan Dr. Murjani I Telp. (0554) 21026 Fax. (0554) 2027784</span>
                <span className="text-[15px] font-bold font-serif tracking-tight mt-0.5">TANJUNG REDEB - BERAU KODE POS 77311</span>
              </div>
              <div className="mt-auto flex justify-center w-full">
                <img src="/logo-berau-1.png" alt="Logo Berau" className="w-[50px] h-[60px] object-contain grayscale" />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Top Padding Area */}
              <div className="flex-1 px-8 pt-8 flex flex-col">
                
                {/* Header Row */}
                <div className="flex justify-between items-start mb-6">
                  <div className="text-[16px] font-serif w-[150px]">UNTUK DINAS</div>
                  <div className="flex-1 text-center">
                    <h1 className="text-[28px] font-bold underline font-serif m-0 tracking-wide inline-block">SURAT BUKTI</h1>
                  </div>
                  <div className="border-[1px] border-black px-2 py-1 text-[11px] w-[110px] leading-tight font-serif shrink-0">
                    <div className="flex justify-between"><span>Lembar ke</span><span>: Satu</span></div>
                    <div className="flex justify-end"><span>Dua</span></div>
                    <div className="flex justify-end"><span>Tiga</span></div>
                    <div className="flex justify-end"><span>Empat</span></div>
                  </div>
                </div>

                {/* Metadata Table */}
                <table className="w-[80%] text-[15px] ml-[150px] mb-6 font-serif">
                  <tbody>
                    <tr>
                      <td className="w-[120px] py-[2px] align-top">Kode Rekening</td>
                      <td className="w-[10px] py-[2px] align-top text-center">:</td>
                      <td className="py-[2px]">{kodeRekening}</td>
                    </tr>
                    <tr>
                      <td className="py-[2px] align-top">Dibukui</td>
                      <td className="py-[2px] align-top text-center">:</td>
                      <td className="py-[2px] font-bold">{noKwitansi}</td>
                    </tr>
                    <tr>
                      <td className="py-[2px] align-top">Program</td>
                      <td className="py-[2px] align-top text-center">:</td>
                      <td className="py-[2px]">{data.program || 'Program Pemberdayaan Usaha Menengah, Usaha Kecil, dan Usaha Mikro (UMKM)'}</td>
                    </tr>
                    <tr>
                      <td className="py-[2px] align-top">Kegiatan</td>
                      <td className="py-[2px] align-top text-center">:</td>
                      <td className="py-[2px]">{data.kegiatan || 'Pemberdayaan usaha Mikro yang dilakukan melalui pendataan, kemitraan, kemudahan perizinan, Kelembagaan dan koordinasi dengan para pemangku kepentingan'}</td>
                    </tr>
                    <tr>
                      <td className="py-[2px] align-top">Sub Kegiatan</td>
                      <td className="py-[2px] align-top text-center">:</td>
                      <td className="py-[2px]">{subKegiatanStr}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Main Text Table */}
                <table className="w-full text-[15px] font-serif mb-auto">
                  <tbody>
                    <tr>
                      <td className="w-[150px] pb-3 align-top italic font-serif">Sudah terima dari</td>
                      <td className="w-[10px] pb-3 align-top text-center">:</td>
                      <td className="pb-3 text-justify pl-1">Bendahara Pengeluaran Pembantu Dinas Koperindag Kabupaten Berau</td>
                    </tr>
                    <tr>
                      <td className="pb-3 align-top italic font-serif pt-2">Banyaknya uang</td>
                      <td className="pb-3 align-top text-center pt-2">:</td>
                      <td className="pb-3 relative pl-1">
                        <div className="relative inline-flex items-center w-full max-w-[95%] border-[2px] border-black ml-[10px]" style={{ transform: 'skewX(-20deg)', padding: '5px 16px' }}>
                          <div className="font-bold italic text-[16px] font-serif uppercase tracking-wide" style={{ transform: 'skewX(20deg)' }}>
                            {terbilang(totalKeseluruhan).toUpperCase()} RUPIAH
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="pt-2 align-top italic font-serif">Untuk Pembayaran</td>
                      <td className="pt-2 align-top text-center">:</td>
                      <td className="pt-2 text-justify leading-tight pl-1 pr-4">
                        {maksudText}
                        <br/>
                        <span className="italic">{subKegiatanStr}</span>
                        <br/>
                        an. {mainTraveler.nama} {travelersList.length > 1 ? 'Dkk.' : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Bottom Row (Terbilang & Signature) */}
                <div className="flex justify-between items-end mb-4">
                  
                  {/* Terbilang Rp */}
                  <div className="flex items-center w-2/3 pt-6">
                    <span className="italic font-serif text-[15px] w-[100px]">Terbilang Rp.</span>
                    <div className="relative inline-flex items-center border-[2px] border-black min-w-[200px] justify-center ml-[5px]" style={{ transform: 'skewX(-20deg)', padding: '4px 0' }}>
                      <div className="font-bold text-[15px] font-serif" style={{ transform: 'skewX(20deg)' }}>
                        {totalKeseluruhan.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div className="h-[2px] bg-black flex-1 -ml-[3px] mt-[12px] mr-[20px]"></div>
                  </div>

                  {/* Signature */}
                  <div className="w-[250px] text-center text-[15px] font-serif">
                    <p className="m-0">Tanjung Redeb, {formatDateId(new Date())}</p>
                    <p className="m-0 mb-12">Tanda Tangan Penerima,</p>
                    <p className="m-0 underline">{mainTraveler.nama}</p>
                  </div>
                </div>

              </div>

              <div className="min-h-[110px] shrink-0 border-t-[3px] border-black flex text-[14px] font-serif">
                {/* KPA */}
                <div className="w-1/3 border-r-[2px] border-black flex flex-col py-2 px-2 text-center">
                  <div className="leading-tight mb-2">
                    <p className="m-0">Mengetahui / Menyetujui</p>
                    <p className="m-0">Kuasa Pengguna Anggaran</p>
                  </div>
                  <div className="flex items-center justify-center h-[52px] mb-2">
                    <span className="font-bold text-lg text-gray-400">$$$</span>
                  </div>
                  <div className="leading-tight mt-auto">
                    <p className="font-bold underline m-0">Hj. Hasnawati, S.E., M.Si.</p>
                    <p className="m-0">Pembina</p>
                    <p className="m-0">NIP. 19681231 199903 2 019</p>
                  </div>
                </div>

                {/* PPTK */}
                <div className="w-1/3 border-r-[2px] border-black flex flex-col py-2 px-2 text-center">
                  <div className="leading-tight mb-2">
                    <p className="m-0">Pejabat Pelaksana Teknis Kegiatan</p>
                    <p className="m-0">PPTK</p>
                  </div>
                  <div className="flex items-center justify-center h-[52px] mb-2">
                    <span className="font-bold text-lg text-gray-400">$$</span>
                  </div>
                  <div className="leading-tight mt-auto">
                    <p className="font-bold underline m-0">Masitah Usis</p>
                    <p className="m-0">Penata Tingkat I</p>
                    <p className="m-0">NIP. 19650727 198603 2 021</p>
                  </div>
                </div>

                {/* Bendahara */}
                <div className="w-1/3 flex flex-col py-2 px-2 text-center">
                  <div className="leading-tight mb-2">
                    <p className="m-0">Lunas Dibayar Pada</p>
                    <p className="m-0">Tgl ................... 20{new Date().getFullYear().toString().substring(2)}</p>
                    <p className="m-0">Bendahara Pengeluaran Pembantu</p>
                  </div>
                  <div className="flex items-center justify-center h-[52px] mb-2">
                    <span className="font-bold text-lg text-gray-400">$</span>
                  </div>
                  <div className="leading-tight mt-auto">
                    <p className="font-bold underline m-0">Darwis Iskandar</p>
                    <p className="m-0">Pengatur Muda Tingkat I</p>
                    <p className="m-0">NIP. 19720613 200701 1 023</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
