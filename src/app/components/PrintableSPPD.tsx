import React from 'react';

interface PelaksanaData {
  nama: string;
  nip: string;
  pangkat: string;
  jabatan: string;
  alatAngkut?: string;
}

interface PrintableSPPDProps {
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
}

export function PrintableSPPD({ data }: PrintableSPPDProps) {
  const calculateDuration = () => {
    if (!data.tanggalPergi || !data.tanggalKembali) return 0;
    const start = new Date(data.tanggalPergi);
    const end = new Date(data.tanggalKembali);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const duration = calculateDuration();

  const printStyles = `
    @media print {
      @page {
        size: A4;
        margin: 2cm;
      }
      body * {
        visibility: hidden;
      }
      .print-content, .print-content * {
        visibility: visible;
      }
      .print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        display: block !important;
      }
      .page-break {
        page-break-after: always;
      }
    }
    .print-content {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
    }
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
    }
    .print-header h1 {
      font-size: 14pt;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
    }
    .print-header h2 {
      font-size: 13pt;
      font-weight: bold;
      margin: 5px 0;
      text-transform: uppercase;
    }
    .print-header p {
      font-size: 10pt;
      margin: 2px 0;
    }
    .print-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 20px 0;
      text-transform: uppercase;
    }
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .print-table td {
      border: 1px solid #000;
      padding: 8px;
      vertical-align: top;
    }
    .print-table th {
      border: 1px solid #000;
      padding: 8px;
    }
    .print-table .label-cell {
      width: 5%;
      text-align: center;
      font-weight: bold;
    }
    .print-table .content-cell {
      padding-left: 10px;
    }
    .print-footer {
      margin-top: 30px;
      text-align: right;
    }
    .print-footer p {
      margin: 5px 0;
    }
    .print-signature {
      margin-top: 60px;
      font-weight: bold;
    }
  `;

  return (
    <div className="print-content" style={{ display: 'none' }}>
      <style>{printStyles}</style>

      {/* Page 1 */}
      <div>
        <div className="print-header">
          <h1>PEMERINTAH KABUPATEN BERAU</h1>
          <h2>DINAS KOPERASI, PERINDUSTRIAN DAN PERDAGANGAN</h2>
          <p>Jl.Dr.Murjani I Telp.( 0554 ) 21026 Fax ( 0554 ) 2027784 Tanjung Redeb-Berau Kode Pos 77311</p>
        </div>

        <div className="print-title">
          SURAT PERJALANAN DINAS (SPD)
        </div>

        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Nomor : {String(Math.floor(Math.random() * 900) + 100)} / / DKPP-KUMKM.3 / SPD
        </p>

        <table className="print-table">
          <tbody>
            <tr>
              <td className="label-cell">1</td>
              <td className="content-cell">Pengguna Anggaran / Kuasa Pengguna Anggaran</td>
              <td className="content-cell">Kepala Bidang Koperasi & UMKM</td>
            </tr>

            <tr>
              <td className="label-cell">2</td>
              <td className="content-cell">Nama / NIP Pegawai yang melaksanakan Perjalanan Dinas</td>
              <td className="content-cell">
                {data.pelaksana.map((p, idx) => (
                  <div key={idx} style={{ marginBottom: idx < data.pelaksana.length - 1 ? '10px' : '0' }}>
                    {p.nama}<br />
                    {p.nip}
                  </div>
                ))}
              </td>
            </tr>

            <tr>
              <td className="label-cell">3</td>
              <td className="content-cell">
                <table style={{ width: '100%', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>a. Pangkat dan golongan</td>
                      <td style={{ border: 'none', padding: '2px' }}>a.</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>b. Jabatan / Instansi</td>
                      <td style={{ border: 'none', padding: '2px' }}>b.</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>c. Tingkat Biaya Perjalanan Dinas</td>
                      <td style={{ border: 'none', padding: '2px' }}>c.</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="content-cell">
                {data.pelaksana.map((p, idx) => (
                  <div key={idx} style={{ marginBottom: idx < data.pelaksana.length - 1 ? '10px' : '0' }}>
                    <div>a. {p.pangkat}</div>
                    <div>b. {p.jabatan}</div>
                    <div>c. C</div>
                  </div>
                ))}
              </td>
            </tr>

            <tr>
              <td className="label-cell">4</td>
              <td className="content-cell">Maksud Perjalanan Dinas</td>
              <td className="content-cell">{data.keperluan}</td>
            </tr>

            <tr>
              <td className="label-cell">5</td>
              <td className="content-cell">Alat angkut yang dipergunakan</td>
              <td className="content-cell">{data.alatAngkut}</td>
            </tr>

            <tr>
              <td className="label-cell">6</td>
              <td className="content-cell">
                <table style={{ width: '100%', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>a. Tempat berangkat</td>
                      <td style={{ border: 'none', padding: '2px' }}>a. {data.tempatBerangkat}</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>b. Tempat tujuan</td>
                      <td style={{ border: 'none', padding: '2px' }}>b. {data.tempatTujuan}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="content-cell"></td>
            </tr>

            <tr>
              <td className="label-cell">7</td>
              <td className="content-cell">
                <table style={{ width: '100%', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>a. Lamanya Perjalanan Dinas</td>
                      <td style={{ border: 'none', padding: '2px' }}>a.</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>b. Tanggal berangkat</td>
                      <td style={{ border: 'none', padding: '2px' }}>b.</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '2px' }}>c. Tanggal harus kembali</td>
                      <td style={{ border: 'none', padding: '2px' }}>c.</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="content-cell">
                <div>a. {duration} Hari</div>
                <div>b. {formatDate(data.tanggalPergi)}</div>
                <div>c. {formatDate(data.tanggalKembali)}</div>
              </td>
            </tr>

            <tr>
              <td className="label-cell">8</td>
              <td className="content-cell">
                <div>Pengikut : Nama</div>
                <div style={{ marginTop: '10px' }}>1.</div>
                <div>2.</div>
                <div>3.</div>
                <div>4.</div>
                <div>5.</div>
              </td>
              <td className="content-cell">
                <table style={{ width: '100%', border: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ border: 'none', padding: '2px', textAlign: 'left' }}>Tanggal Lahir</th>
                      <th style={{ border: 'none', padding: '2px', textAlign: 'left' }}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={2} style={{ border: 'none', height: '100px' }}></td></tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td className="label-cell">9</td>
              <td className="content-cell">
                <div>Pembebanan Anggaran</div>
                <div>a. SKPD</div>
                <div>b. Kode Rekening</div>
              </td>
              <td className="content-cell">
                <br />
                <div>a. Dinas Koperindag Kabupaten Berau</div>
                <div>b. 2.17.01.2.06.09.5.1.02.04.01.0003</div>
              </td>
            </tr>

            <tr>
              <td colSpan={3} style={{ borderTop: '1px solid #000', padding: '10px' }}>
                <div>Keterangan lain-lain: -</div>
                <div>*Coret yang tidak perlu</div>
                <div className="print-footer">
                  <p>Dikeluarkan di : Tanjung Redeb</p>
                  <p>Tanggal : {formatDate(new Date().toISOString().split('T')[0])}</p>
                  <br />
                  <p>Kuasa Pengguna Anggaran</p>
                  <div className="print-signature">
                    <p style={{ textDecoration: 'underline' }}>WAHID HASYIM</p>
                    <p>Penata Tk I</p>
                    <p>NIP. 198202082005021002</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Page 2 */}
      <div className="page-break">
        <table className="print-table" style={{ marginTop: '40px' }}>
          <tbody>
            <tr>
              <td className="label-cell" rowSpan={2}>I</td>
              <td className="content-cell" style={{ width: '45%' }}>
                <div>Berangkat dari : {data.tempatBerangkat}</div>
                <div>(tempat kedudukan) :</div>
                <div>Ke :</div>
                <div>Pada Tanggal :</div>
                <div>Kepala :</div>
                <div style={{ marginTop: '40px' }}>Selaku Pejabat Pelaksana Teknis Kegiatan</div>
                <div style={{ marginTop: '60px', fontWeight: 'bold', textDecoration: 'underline' }}>
                  RAHMAWATI, S.E.
                </div>
                <div>Penata Muda Tk. I</div>
                <div>NIP. 19951130 202203 2 030</div>
              </td>
              <td className="content-cell">
                <div>Tiba :</div>
                <div>Pada Tanggal :</div>
                <div>Kepala :</div>
              </td>
            </tr>

            {[...Array(5)].map((_, idx) => (
              <tr key={idx}>
                <td className="label-cell">{['II', 'III', 'IV', 'V', 'VI'][idx]}</td>
                <td className="content-cell">
                  <div>Tiba :</div>
                  <div>Pada Tanggal :</div>
                  <div>Kepala :</div>
                </td>
                <td className="content-cell">
                  {idx === 4 ? (
                    <React.Fragment>
                      <div>Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.</div>
                      <div style={{ marginTop: '60px', fontWeight: 'bold', textDecoration: 'underline' }}>
                        WAHID HASYIM
                      </div>
                      <div>Penata Tk I</div>
                      <div>NIP. 198202082005021002</div>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div>Tiba :</div>
                      <div>Pada Tanggal :</div>
                      <div>Kepala :</div>
                    </React.Fragment>
                  )}
                </td>
              </tr>
            ))}

            <tr>
              <td className="label-cell">VII</td>
              <td colSpan={2} className="content-cell">Catatan Lain-lain</td>
            </tr>

            <tr>
              <td className="label-cell">VIII</td>
              <td colSpan={2} className="content-cell">
                <div style={{ fontWeight: 'bold' }}>Perhatian :</div>
                <div style={{ marginTop: '10px', fontSize: '10pt' }}>
                  Pengguna Anggaran/Kuasa Pengguna Anggaran yang menerbitkan SPD, pejabat/pegawai/pihak lain yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Daerah apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
