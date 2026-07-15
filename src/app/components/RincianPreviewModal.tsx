import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { terbilang } from '../utils/terbilang';

interface RincianPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function RincianPreviewModal({ isOpen, onClose, data }: RincianPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

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
    if (n.includes("hasnawati")) return "Penata Tk. I / III.d";
    if (n.includes("masitah")) return "Penata Tingkat I / IIId";
    if (n.includes("rahmawati")) return "Penata Muda Tk. I / III.b";
    if (n.includes("trimo")) return "Pengatur Muda/Iia";
    if (n.includes("devi") || n.includes("fadli")) return "-";
    return "Penata / IIIc";
  };

  const numberToText = (num: number) => {
    const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas'];
    return words[num] || num.toString();
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
  const sppdClean = data.noSppd || '';
  
  const generateSppdList = () => {
    let rawNoSppd = data.noSppd || "-";
    if (rawNoSppd.includes("SPPD-V2/2026")) {
      rawNoSppd = rawNoSppd.replace("SPPD-V2/2026", "DKPP-KUMKM.3 / SPD");
    }
    if (rawNoSppd === "-") return travelersList.map(() => "-");
    
    const parts = rawNoSppd.split('/');
    if (parts.length < 2) return travelersList.map(() => rawNoSppd);
    
    return travelersList.map((_: any, i: number) => {
      const num = parseInt(parts[1], 10);
      if (isNaN(num)) return rawNoSppd;
      return `${parts[0]}/${String(num + i).padStart(parts[1].length, '0')}/${parts.slice(2).join('/')}`;
    });
  };

  const sppdList = generateSppdList();
  const lamaHari = Math.max(...travelersList.map((t: any) => t.jumlahHari), (data.lamaHari || 3));

  const isBendaharaApproved = ['menunggu_verifikasi_pptk', 'menunggu_verifikasi_kpa', 'menunggu_pembayaran', 'selesai'].includes(data.status);
  const isKPAApproved = ['menunggu_pembayaran', 'selesai'].includes(data.status);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-[#525659] w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 bg-[#323639] text-white border-b border-black/20 shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-1.5 rounded text-red-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Rincian_Dalam_Daerah_{data.kota || 'BERAU'}.pdf</h3>
                  <p className="text-xs text-slate-400">1/1</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-300" title="Tutup">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#525659] custom-scrollbar">
              <div ref={printRef} className="w-full max-w-[1100px] mx-auto flex flex-col gap-8 pb-8" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '13px', lineHeight: '1.4' }}>
                <div className="bg-white text-black py-12 px-8 shadow-2xl w-full min-h-[700px] relative flex flex-col shrink-0 box-border">
                  
                  <div className="text-center font-bold text-[14.5px] mb-8">
                    <p className="m-0 underline">RINCIAN BIAYA PERJALANAN DINAS DALAM DAERAH KABUPATEN BERAU</p>
                    <p className="m-0 underline">KECAMATAN {data.kota ? data.kota.toUpperCase() : 'BERAU'}</p>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold m-0 text-[14.5px]">Selama {lamaHari} ({numberToText(lamaHari)}) hari Pada Tanggal : {formatDateId(data.tanggalMulai)} s/d {formatDateId(data.tanggalSelesai)}</p>
                  </div>

                  <table className="mb-4 text-[13px]">
                    <tbody>
                      <tr>
                        <td className="w-40 align-top">LAMPIRAN SPD NOMOR</td>
                        <td className="w-3 align-top">:</td>
                        <td>
                          {sppdList.map((spd: string, idx: number) => (
                            <div key={idx}>{spd}</div>
                          ))}
                        </td>
                      </tr>
                      <tr>
                        <td className="align-top pt-3">TANGGAL</td>
                        <td className="align-top pt-3">:</td>
                        <td className="pt-3">{formatDateId(new Date())}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full text-[13px] border-collapse mb-8">
                    <thead>
                      <tr>
                        <th className="border border-black font-bold p-1 text-center w-[4%]" rowSpan={3}>NO</th>
                        <th className="border border-black font-bold p-1 text-center" colSpan={2}>RINCIAN BIAYA PERJALANAN DINAS</th>
                        <th className="border border-black font-bold p-1 text-center" colSpan={6}>UANG HARIAN</th>
                        <th className="border border-black font-bold p-1 text-center w-[11%]" rowSpan={2}>Biaya<br/>Penginapan</th>
                        <th className="border border-black font-bold p-1 text-center w-[11%]" rowSpan={2}>Biaya<br/>Transportasi</th>
                        <th className="border border-black font-bold p-1 text-center w-[11%]" rowSpan={3}>JUMLAH</th>
                        <th className="border border-black font-bold p-1 text-center w-[15%]" rowSpan={3}>KETERANGAN</th>
                      </tr>
                      <tr>
                        <th className="border-b border-black font-bold p-1 text-center w-[18%]">NAMA</th>
                        <th className="border-b border-r border-black font-bold p-1 text-center w-[13%]">Pangkat Gol /</th>
                        <th className="border-b border-black" colSpan={6}></th>
                      </tr>
                      <tr>
                        <th className="border-b border-black font-bold p-1 text-center"></th>
                        <th className="border-b border-r border-black font-bold p-1 text-center">Ruang</th>
                        <th className="border-b border-black" colSpan={6}></th>
                        <th className="border border-black font-bold p-1 text-center"></th>
                        <th className="border border-black font-bold p-1 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {travelersList.map((t: any, i: number) => {
                        const subtotal = t.totalUangHarian + t.totalBiayaHotel + t.totalSewaKendaraan;
                        return (
                          <React.Fragment key={i}>
                            <tr>
                              <td className="border-l border-r border-black p-1 text-center align-middle" rowSpan={2}>{i + 1}</td>
                              <td className="border-r border-black p-1 pl-2 font-normal text-left align-middle">{t.nama}</td>
                              <td className="border-r border-black p-1 text-center font-normal align-middle" rowSpan={2}>{t.pangkatGolongan || '-'}</td>
                              <td className="border-b border-black p-1 text-center font-normal w-[4%]" rowSpan={2}>{t.jumlahHari}</td>
                              <td className="border-b border-black p-1 text-center font-normal w-[3%]" rowSpan={2}>OH</td>
                              <td className="border-b border-black p-1 text-center font-normal w-[2%]" rowSpan={2}>x</td>
                              <td className="border-b border-black p-1 text-right font-normal pr-2 w-[8%]" rowSpan={2}>{t.uangHarianPerHari.toLocaleString('id-ID')}</td>
                              <td className="border-b border-black p-1 text-center font-normal w-[2%]" rowSpan={2}>=</td>
                              <td className="border-r border-b border-black p-1 text-right font-normal pr-2 w-[10%]" rowSpan={2}>{t.totalUangHarian.toLocaleString('id-ID')}</td>
                              <td className="border-r border-b border-black p-1 text-right font-normal pr-2" rowSpan={2}>{t.totalBiayaHotel.toLocaleString('id-ID')}</td>
                              <td className="border-r border-b border-black p-1 text-right font-normal pr-2" rowSpan={2}>{t.totalSewaKendaraan.toLocaleString('id-ID')}</td>
                              <td className="border-r border-b border-black p-1 text-right font-normal pr-2" rowSpan={2}>{subtotal.toLocaleString('id-ID')}</td>
                              {i === 0 && (
                                <td className="border border-black p-2 text-center align-middle" rowSpan={travelersList.length * 2}>
                                  Uang harian dibayarkan 2 (dua) hari saat berangkat dan pulang
                                </td>
                              )}
                            </tr>
                            <tr>
                              <td className="border-r border-b border-black border-b-dotted p-1 pl-2 font-normal text-left">{t.nip && t.nip !== '-' ? `NIP. ${t.nip}` : 'PTT'}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      <tr>
                        <td colSpan={8} className="border border-black font-bold p-2 text-left">Jumlah Biaya Perjalanan Dinas</td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td colSpan={2} className="border border-black font-bold p-2 text-right">{totalKeseluruhan.toLocaleString('id-ID')}</td>
                        <td className="border border-black"></td>
                      </tr>
                      <tr>
                        <td colSpan={13} className="border border-black font-bold italic p-2">Terbilang : ( {terbilang(totalKeseluruhan).trim()} Rupiah )</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Tanda Tangan Pembayaran */}
                  <div className="flex mt-2 text-[13px] mb-8">
                    <div className="w-[45%]"></div>
                    <div className="w-[55%] pl-8">
                      <p className="mb-1">Telah dibayar sejumlah uang sebesar,</p>
                      <p className="font-bold mb-4">Rp {totalKeseluruhan.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="flex mt-2 text-[13px] mb-12 relative">
                    <div className="w-[45%] text-center pt-8">
                      <p className="mb-2">Bendahara Pengeluaran Pembantu,</p>
                      <div className="flex items-center justify-center my-2 h-[68px]">
                        <span className="font-bold text-xl text-gray-400">@@</span>
                      </div>
                      <p className="font-bold underline mb-0">Darwis Iskandar</p>
                      <p className="m-0">NIP. 19720613 200701 1 023</p>
                    </div>
                    <div className="w-[55%] text-center pl-8">
                      <p className="mb-8">Tanjung Redeb, {formatDateId(new Date())}</p>
                      
                      <table className="w-full text-left mb-6">
                        <tbody>
                          <tr>
                            <td className="font-normal w-[45%]">Yang Menerima</td>
                            <td className="font-normal text-center w-[25%]">Jumlah</td>
                            <td className="font-normal text-center w-[30%]">Tanda Tangan</td>
                          </tr>
                          {travelersList.map((t: any, i: number) => {
                            const sub = t.totalUangHarian + t.totalBiayaHotel + t.totalSewaKendaraan;
                            return (
                              <React.Fragment key={i}>
                                <tr>
                                  <td className="pt-2">{i+1}.</td>
                                  <td></td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td className="pl-4 border-t border-black pb-4">{t.nama}</td>
                                  <td className="text-right pr-4 border-t border-black pb-4">{sub.toLocaleString('id-ID')}</td>
                                  <td className="border-t border-black pb-4 text-center">{i+1}. .......................</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                          <tr>
                            <td className="border-t border-b border-black py-1 font-normal">Jumlah dibayar</td>
                            <td className="border-t border-b border-black py-1 font-bold text-right pr-4">{totalKeseluruhan.toLocaleString('id-ID')}</td>
                            <td className="border-t border-b border-black py-1"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SPPD RAMPUNG SECTION */}
                  <div className="mt-8 text-[13px]">
                    <p className="font-normal mb-3 pl-8">PERHITUNGAN SPPD RAMPUNG</p>
                    <table className="pl-8 mb-10 w-1/2 ml-8">
                      <tbody>
                        <tr>
                          <td className="w-[50%] py-1">1. Ditetapkan sejumlah</td>
                          <td className="w-[50%] py-1">: Rp {totalKeseluruhan.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                          <td className="py-1">2. Yang telah dibayar semula</td>
                          <td className="py-1">: Rp 0</td>
                        </tr>
                        <tr>
                          <td className="py-1">3. Sisa kurang/lebih</td>
                          <td className="py-1">: Rp {totalKeseluruhan.toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end text-[13px] text-center pr-12">
                    <div>
                      <p className="mb-1">Mengetahui/Menyetujui :</p>
                      <p className="mb-2">Kuasa Pengguna Anggaran</p>
                      <div className="flex items-center justify-center my-2 h-[68px]">
                        <span className="font-bold text-xl text-gray-400">@@@</span>
                      </div>
                      <p className="font-bold underline mb-0 text-[14px]">Wahid Hasyim</p>
                      <p className="m-0 text-[14px]">Pembina</p>
                      <p className="m-0 text-[14px]">NIP. 19681231 199903 2 019</p>
                    </div>
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
