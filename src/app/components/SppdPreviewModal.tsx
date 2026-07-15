import React, { useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { getStatusPengajuan, getTanggalPersetujuan } from '../utils/statusStore';

interface SppdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function SppdPreviewModal({ isOpen, onClose, data }: SppdPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activePersonIndex, setActivePersonIndex] = React.useState(0);

  if (!isOpen || !data) return null;



  const formatDateId = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const pelaksanaList = data.pelaksana || [data.pembuat];
  const person = pelaksanaList[activePersonIndex];

  const getSppdCleanForIndex = (index: number) => {
    const sppdRaw = data.noSppd || '';
    const parts = sppdRaw.split('/');
    if (parts.length >= 2) {
      const baseNum = parseInt(parts[1], 10);
      if (!isNaN(baseNum)) {
        const paddedNum = String(baseNum + index).padStart(5, '0');
        return `${parts[0]}/${paddedNum}/DKPP-KUMKM.3 / SPD`;
      }
      return `${parts[0]}/${parts[1]}/DKPP-KUMKM.3 / SPD`;
    }
    return sppdRaw;
  };

  const sppdClean = getSppdCleanForIndex(activePersonIndex);
  const kotaAsal = data.kotaAsal || 'Tanjung Redeb';
  
  let lamaHari = 1;
  if (data.tanggalPergi && data.tanggalKembali) {
    const start = new Date(data.tanggalPergi).getTime();
    const end = new Date(data.tanggalKembali).getTime();
    lamaHari = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  const sppdRaw = data.noSppd || data.no_sppd || '';
  const finalStatus = data.statusPengajuan || getStatusPengajuan(sppdRaw);
  const finalTanggalPersetujuan = data.tanggalPersetujuan || getTanggalPersetujuan(sppdRaw);

  const qrData = `Disetujui secara elektronik oleh:\nNama: WAHID HASYIM\nJabatan: Kepala Bidang Koperasi dan UKM\nNo. SPPD: ${sppdClean}\nTanggal: ${formatDateId(finalTanggalPersetujuan || data.tanggalPengajuan)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-[#525659] w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Pelaksana */}
          <div className="w-64 bg-[#2b2e30] border-r border-black/20 flex flex-col shrink-0">
            <div className="p-4 border-b border-black/20">
              <h3 className="text-white font-semibold text-sm">Daftar SPPD</h3>
              <p className="text-slate-400 text-xs mt-1">{pelaksanaList.length} Dokumen SPPD</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {pelaksanaList.map((p: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActivePersonIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    activePersonIndex === idx 
                      ? 'bg-[#00475e] text-white' 
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{p.nama}</div>
                  <div className="text-xs opacity-70 truncate mt-0.5">{getSppdCleanForIndex(idx)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main PDF Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Header bar styled like a PDF viewer */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#323639] text-white border-b border-black/20 shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-1.5 rounded text-red-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{sppdClean.replace(/[^a-zA-Z0-9]/g, '_')}.pdf</h3>
                  <p className="text-xs text-slate-400">1/1</p>
                </div>
              </div>
          <div className="flex items-center gap-2">

            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-300"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#525659] custom-scrollbar">
          {/* PDF Page Container */}
          <div 
            ref={printRef}
            className="w-full max-w-[794px] mx-auto flex flex-col gap-8 pb-8"
            style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}
          >
            {/* Halaman 1 */}
            <div className="bg-white text-black p-8 shadow-2xl w-full min-h-[1123px] relative flex flex-col shrink-0 box-border">
              <div className="border-[3px] border-black w-full h-full flex flex-col relative box-border flex-1">
                {/* Kop Surat */}
                <div className="flex items-center border-b-[3px] border-black pb-2 pt-2 px-4 relative shrink-0">
                  <div className="w-20 shrink-0 flex items-center justify-center">
                    <img src="/logo-berau-1.png" alt="Logo Berau" className="w-[60px] h-auto object-contain" />
                  </div>
                  <div className="flex-1 text-center pr-20">
                    <h1 className="text-sm font-bold m-0 uppercase tracking-wide">PEMERINTAH KABUPATEN BERAU</h1>
                    <h2 className="text-[15px] font-bold m-0 uppercase mt-1">DINAS KOPERASI, PERINDUSTRIAN DAN PERDAGANGAN</h2>
                    <p className="text-[10px] m-0 mt-0.5 border-b border-black inline-block pb-0.5">Jl. Dr. Murjani I Telp. (0554) 21026 Fax (0554) 2027784 Tanjung Redeb - Berau Kode Pos 77311</p>
                  </div>
                </div>

                {/* Judul */}
                <div className="text-center py-4 border-b-[3px] border-black shrink-0">
                  <h3 className="text-[13px] font-bold m-0 underline uppercase tracking-wider">SURAT PERJALANAN DINAS (SPD)</h3>
                  <p className="m-0 mt-1">Nomor : {sppdClean}</p>
                </div>

                {/* Tabel Isi */}
                <table className="w-full border-collapse border-none shrink-0">
                  <tbody>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 w-[3%] text-center align-top">1</td>
                      <td className="border-b border-r border-black p-1.5 w-[42%] align-top">Pengguna Anggaran / Kuasa Pengguna Anggaran</td>
                      <td className="border-b border-black p-1.5 align-top">Kepala Bidang Koperasi & UMKM</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">2</td>
                      <td className="border-b border-r border-black p-1.5 align-top">Nama / NIP Pegawai yang melaksanakan<br/>Perjalanan Dinas</td>
                      <td className="border-b border-black p-1.5 align-top">
                        <div className="font-bold">{person?.nama}</div>
                        <div>{person?.nip}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">3</td>
                      <td className="border-b border-r border-black p-1.5 align-top">
                        <div>a. Pangkat dan golongan</div>
                        <div>b. Jabatan / Instansi</div>
                        <div>c. Tingkat Biaya Perjalanan Dinas</div>
                      </td>
                      <td className="border-b border-black p-1.5 align-top">
                        <div>a. {person?.pangkat || 'Penata Muda / III.a'}</div>
                        <div>b. {person?.jabatan || 'Staf Pelaksana'}</div>
                        <div>c. C</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">4</td>
                      <td className="border-b border-r border-black p-1.5 align-top">Maksud Perjalanan Dinas</td>
                      <td className="border-b border-black p-1.5 align-top">{data.keperluan || '-'}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">5</td>
                      <td className="border-b border-r border-black p-1.5 align-top">Alat angkut yang dipergunakan</td>
                      <td className="border-b border-black p-1.5 align-top">{data.alatAngkut || 'Kendaraan Darat'}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">6</td>
                      <td className="border-b border-r border-black p-1.5 align-top">
                        <div>a. Tempat berangkat</div>
                        <div>b. Tempat tujuan</div>
                      </td>
                      <td className="border-b border-black p-1.5 align-top">
                        <div>a. {kotaAsal}</div>
                        <div>b. {data.kota}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">7</td>
                      <td className="border-b border-r border-black p-1.5 align-top">
                        <div>a. Lamanya Perjalanan Dinas</div>
                        <div>b. Tanggal berangkat</div>
                        <div>c. Tanggal harus kembali/tiba di tempat baru*)</div>
                      </td>
                      <td className="border-b border-black p-1.5 align-top">
                        <div>a. {lamaHari} ({lamaHari === 1 ? 'Satu' : lamaHari === 2 ? 'Dua' : lamaHari === 3 ? 'Tiga' : lamaHari}) Hari</div>
                        <div>b. {formatDateId(data.tanggalPergi)}</div>
                        <div>c. {formatDateId(data.tanggalKembali)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">8</td>
                      <td className="border-b border-r border-black p-0 align-top">
                        <div className="border-b border-black p-1 pl-1.5 font-normal">Pengikut :</div>
                        <div className="p-1.5 h-24 align-top"></div>
                      </td>
                      <td className="border-b border-black p-0 align-top">
                        <table className="w-full h-full border-none">
                          <thead>
                            <tr>
                              <th className="border-b border-r border-black p-1 font-normal text-center w-[45%]">Tanggal Lahir</th>
                              <th className="border-b border-black p-1 font-normal text-center w-[55%]">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border-r border-black p-1.5 h-24"></td>
                              <td className="p-1.5 h-24"></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 text-center align-top">9</td>
                      <td className="border-b border-r border-black p-1.5 align-top">
                        <div className="mb-1">Pembebanan Anggaran</div>
                        <div>a. SKPD</div>
                        <div>b. Kode Rekening</div>
                      </td>
                      <td className="border-b border-black p-1.5 align-top">
                        <div className="mt-[18px]">a. Dinas Koperindag Kabupaten Berau</div>
                        <div>b. {data.kodeRekening || '-'}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-1.5 align-top"></td>
                      <td className="border-b border-r border-black p-1.5 align-top">
                        <div>Keterangan lain-lain</div>
                      </td>
                      <td className="border-b border-black p-1.5 align-top">-</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer / Tanda Tangan */}
                <div className="flex-1 flex mt-2 text-[11px] px-2 pb-4">
                  <div className="w-[48%] pl-6 flex flex-col justify-end">
                    <div>*Coret yang tidak perlu</div>
                  </div>
                  <div className="w-[52%]">
                    <table className="w-full mb-3">
                      <tbody>
                        <tr>
                          <td className="w-[35%] py-0.5">Dikeluarkan di</td>
                          <td className="w-[5%] py-0.5">:</td>
                          <td className="w-[60%] py-0.5">{kotaAsal}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">Tanggal</td>
                          <td className="py-0.5">:</td>
                          <td className="py-0.5">{formatDateId(finalTanggalPersetujuan || data.tanggalPengajuan || '-')}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="text-center pr-10">
                      <p className="mb-2">Kuasa Pengguna Anggaran</p>
                      <div className="flex justify-center h-[55px] my-1 relative">
                        {finalStatus === 'Disetujui' && (
                          <img src={qrUrl} alt="QR Code" className="w-[55px] h-[55px] absolute" />
                        )}
                      </div>
                      <p className="font-bold underline mb-0">Wahid Hasyim</p>
                      <p className="m-0">Penata Tk I</p>
                      <p className="m-0">NIP. 198202082005021002</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Break for print */}
            <div className="html2pdf__page-break"></div>

            {/* Halaman 2: Visum */}
            <div className="bg-white text-black py-10 px-8 shadow-2xl w-full min-h-[1123px] relative flex flex-col shrink-0 box-border">
              {/* Header Removed */}

              {/* Grid Visum */}
              <table className="w-full border-collapse border border-black text-[11px] flex-1 h-full">
                <tbody className="h-full">
                  {/* Row I */}
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]"></td>
                    <td className="border border-black p-0 w-1/2 align-top h-[14%]">
                      <div className="h-full flex flex-col p-2">
                        <table className="w-full">
                          <tbody>
                            <tr><td className="w-5 align-top">I</td><td className="w-28">Berangkat dari</td><td className="w-2">:</td><td>{kotaAsal}</td></tr>
                            <tr><td></td><td>(tempat kedudukan)</td><td>:</td><td></td></tr>
                            <tr><td></td><td>Ke</td><td>:</td><td>{data.kota}</td></tr>
                            <tr><td></td><td>Pada Tanggal</td><td>:</td><td>{formatDateId(data.tanggalPergi)}</td></tr>
                            <tr><td></td><td>Kepala</td><td>:</td><td></td></tr>
                            <tr><td></td><td colSpan={3}>Selaku Pejabat Pelaksana Teknis Kegiatan</td></tr>
                          </tbody>
                        </table>
                        <div className="mt-auto text-center pt-6">
                          <p className="font-bold underline m-0">Rahmawati</p>
                          <p className="m-0">Penata Muda Tk. I</p>
                          <p className="m-0">NIP. 199511302022032030</p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Row II */}
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-5 align-top">II</td><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td></td><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td></td><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Row III */}
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-5 align-top">III</td><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td></td><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td></td><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Row IV */}
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-5 align-top">IV</td><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td></td><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td></td><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Row V */}
                  <tr>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-5 align-top">V</td><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td></td><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td></td><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border border-black p-2 w-1/2 align-top h-[14%]">
                      <table className="w-full">
                        <tbody>
                          <tr><td className="w-20">Tiba</td><td className="w-2">:</td><td></td></tr>
                          <tr><td>Pada Tanggal</td><td>:</td><td></td></tr>
                          <tr><td>Kepala</td><td>:</td><td></td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Row VI */}
                  <tr>
                    <td className="border border-black p-0 w-1/2 align-top h-[20%]">
                      <div className="h-full flex flex-col p-2">
                        <table className="w-full">
                          <tbody>
                            <tr><td className="w-5 align-top">VI</td><td className="w-20">Tiba</td><td className="w-2">:</td><td>{kotaAsal}</td></tr>
                            <tr><td></td><td>Pada Tanggal</td><td>:</td><td>{formatDateId(data.tanggalKembali)}</td></tr>
                            <tr><td></td><td>Kepala</td><td>:</td><td>Kuasa Pengguna Anggaran</td></tr>
                          </tbody>
                        </table>
                        <div className="mt-auto text-center pt-6">
                          <p className="font-bold underline m-0">Wahid Hasyim</p>
                          <p className="m-0">Penata Tk I</p>
                          <p className="m-0">NIP. 198202082005021002</p>
                        </div>
                      </div>
                    </td>
                    <td className="border border-black p-2 w-1/2 align-middle text-justify px-4">
                      Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                    </td>
                  </tr>

                  {/* Row VII */}
                  <tr>
                    <td colSpan={2} className="border border-black p-1 px-2 h-[4%] align-middle">
                      <div className="flex gap-2">
                        <span className="w-5">VII</span>
                        <span>Catatan Lain-lain</span>
                      </div>
                    </td>
                  </tr>

                  {/* Row VIII */}
                  <tr>
                    <td colSpan={2} className="border border-black p-2 h-[8%] align-top">
                      <div className="flex gap-2">
                        <span className="w-5 font-bold">VIII</span>
                        <span className="font-bold">Perhatian :</span>
                      </div>
                      <div className="pl-7 text-justify mt-0.5 leading-snug">
                        Pengguna Anggaran/Kuasa Pengguna Anggaran yang menerbitkan SPD, pejabat/pegawai/pihak lain yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Daerah apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
  );
}
