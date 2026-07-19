import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { KPICard } from '../components/KPICard';
import { Wallet, TrendingUp, Edit, Trash2, Plus, Users } from 'lucide-react';
import { ProfileCard } from '../components/ProfileCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { 
  getSubKegiatanData, 
  SubKegiatan, 
  updateSubKegiatan,
  addSubKegiatan, 
  deleteSubKegiatan,
  syncSubKegiatanData
} from '../utils/anggaranStore';
import { apiRequest, getSupabaseClient } from '../utils/supabaseClient';
import { getStatusPengajuan, batchGetStatusPengajuan } from '../utils/statusStore';
import { batchGetLaporanStatus, batchGetPelaksanaData, batchGetProgramData, getHiddenSppdIds } from '../utils/supabaseDataStore';
import { Toaster, toast } from 'sonner';

export default function DashboardBendahara() {
  const [data, setData] = useState<SubKegiatan[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubKegiatan>>({});
  const [availablePPTK, setAvailablePPTK] = useState<{ nip: string, nama: string }[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<SubKegiatan> & { kodeRekening?: string; namaSubKegiatanRaw?: string }>({
    id: "",
    nama: "",
    program: "",
    kegiatan: "",
    kodeRekening: "",
    namaSubKegiatanRaw: "",
    paguDalamDaerah: 0,
    realisasiDalamDaerah: 0,
    paguLuarDaerah: 0,
    realisasiLuarDaerah: 0,
    pengelolaNips: [],
    pptkNip: ""
  });

  useEffect(() => {
    loadData();
    fetchPPTK();
  }, []);

  const fetchPPTK = async () => {
    // Daftar PPTK default yang selalu tersedia
    const defaultPPTK = [
      { nip: "199511302022032030", nama: "Rahmawati" },
      { nip: "199509012022031013", nama: "Irwan Suprianto" }
    ];

    try {
      // Coba ambil dari user_profiles jika ada
      const { data: profileData, error } = await getSupabaseClient()
        .from('user_profiles')
        .select('nip, nama, role')
        .eq('role', 'pptk');
      
      if (!error && profileData && profileData.length > 0) {
        setAvailablePPTK(profileData.map((u: any) => ({ nip: u.nip, nama: u.nama })));
      } else {
        setAvailablePPTK(defaultPPTK);
      }
    } catch (e) {
      console.error("Failed to fetch PPTK from DB, using default list", e);
      setAvailablePPTK(defaultPPTK);
    }
  };

  const loadData = async () => {
    await syncSubKegiatanData();
    const baseData = getSubKegiatanData();
    try {
      const data = await getAllPengajuan();
      const res = { data };
      const pengajuanData = res.data || [];
      const subKegiatanRealisasi: Record<string, { dalam: number, luar: number }> = {};
      
      baseData.forEach(sk => {
        subKegiatanRealisasi[sk.nama] = { dalam: 0, luar: 0 };
      });

      const sppdList = pengajuanData.map((row: any) => row.noSppd || row.no_sppd || '').filter(Boolean);
      const [statusMap, laporanStatusMap, hiddenIds, pelaksanaMap, programDataMap] = await Promise.all([
        batchGetStatusPengajuan(sppdList),
        batchGetLaporanStatus(sppdList),
        getHiddenSppdIds(),
        batchGetPelaksanaData(sppdList),
        batchGetProgramData(sppdList),
      ]);

      pengajuanData.forEach(row => {
        const sppd = row.noSppd || row.no_sppd || '';
        const status = statusMap[sppd] || 'Menunggu Persetujuan';
        const spjStatus = laporanStatusMap[sppd] || row.status || "belum_spj";

        const parsedProgram = programDataMap[sppd] || {};
        const subKegiatanName = parsedProgram.subKegiatan || row.subKegiatan;

        const isHiddenOrInvalid = hiddenIds.includes(sppd) || !sppd.includes('SPPD') || (row.isDuplicated && status !== 'Disetujui');

        if (isHiddenOrInvalid) return;

        if (spjStatus === 'selesai') {
          let actualTotalAnggaran = row.totalAnggaran || 0;
          try {
            const storedPelaksana = pelaksanaMap[sppd];
            if (storedPelaksana && storedPelaksana.length > 0) {
              const hydratedPelaksana = storedPelaksana;
              actualTotalAnggaran = hydratedPelaksana.reduce((sum: number, p: any) => sum + (p.totalBiayaHotel || 0) + (p.totalSewaKendaraan || 0) + (p.totalUangHarian || 0) + (p.totalPesawat || 0) + (p.totalKeretaApi || 0) + (p.totalBiayaTol || 0), 0);
            }
          } catch(e) {}

          if (row.tipePerjalanan === 'Dalam Daerah') {
            if (subKegiatanName && subKegiatanRealisasi[subKegiatanName]) {
              subKegiatanRealisasi[subKegiatanName].dalam += actualTotalAnggaran;
            }
          }
          else if (row.tipePerjalanan === 'Luar Daerah') {
            if (subKegiatanName && subKegiatanRealisasi[subKegiatanName]) {
              subKegiatanRealisasi[subKegiatanName].luar += actualTotalAnggaran;
            }
          }
        }
      });

      const updatedData = baseData.map(sk => ({
        ...sk,
        realisasiDalamDaerah: subKegiatanRealisasi[sk.nama]?.dalam || 0,
        realisasiLuarDaerah: subKegiatanRealisasi[sk.nama]?.luar || 0
      }));
      setData(updatedData);
    } catch (err) {
      console.error("Error loading realisasi data:", err);
      setData(baseData);
    }
  };

  const totalPaguDalamDaerah = data.reduce((acc, curr) => acc + curr.paguDalamDaerah, 0);
  const totalRealisasiDalamDaerah = data.reduce((acc, curr) => acc + curr.realisasiDalamDaerah, 0);
  
  const totalPaguLuarDaerah = data.reduce((acc, curr) => acc + curr.paguLuarDaerah, 0);
  const totalRealisasiLuarDaerah = data.reduce((acc, curr) => acc + curr.realisasiLuarDaerah, 0);

  const kpiData = [
    {
      icon: Wallet,
      value: `Rp ${totalPaguDalamDaerah.toLocaleString('id-ID')}`,
      label: 'Total Pagu (Dalam Daerah)',
      bgColor: 'bg-[#c0e8ff]',
      iconColor: 'text-[#00475e]',
      hoverColor: 'group-hover:text-[#00475e]'
    },
    {
      icon: TrendingUp,
      value: `Rp ${totalRealisasiDalamDaerah.toLocaleString('id-ID')}`,
      label: 'Realisasi (Dalam Daerah)',
      bgColor: 'bg-[#ffddbb]',
      iconColor: 'text-[#5f3800]',
      hoverColor: 'group-hover:text-[#5f3800]'
    },
    {
      icon: Wallet,
      value: `Rp ${totalPaguLuarDaerah.toLocaleString('id-ID')}`,
      label: 'Total Pagu (Luar Daerah)',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      hoverColor: 'group-hover:text-green-600'
    },
    {
      icon: TrendingUp,
      value: `Rp ${totalRealisasiLuarDaerah.toLocaleString('id-ID')}`,
      label: 'Realisasi (Luar Daerah)',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      hoverColor: 'group-hover:text-purple-600'
    }
  ];

  const handleSaveEdit = async () => {
    if (isEditing) {
      const currentItem = data.find(d => d.id === isEditing);
      if (!currentItem) return;

      // Buat object lengkap dengan semua field dari item saat ini, lalu overwrite dengan perubahan
      const updatedItem: SubKegiatan = {
        ...currentItem,
        paguDalamDaerah: editForm.paguDalamDaerah !== undefined ? editForm.paguDalamDaerah : currentItem.paguDalamDaerah,
        paguLuarDaerah: editForm.paguLuarDaerah !== undefined ? editForm.paguLuarDaerah : currentItem.paguLuarDaerah,
        pptkNip: editForm.pptkNip !== undefined ? editForm.pptkNip : currentItem.pptkNip,
      };

      console.log('[handleSaveEdit] Current:', {
        paguDalam: currentItem.paguDalamDaerah,
        paguLuar: currentItem.paguLuarDaerah,
        pptkNip: currentItem.pptkNip
      });
      console.log('[handleSaveEdit] Edit form:', editForm);
      console.log('[handleSaveEdit] Will save:', {
        paguDalam: updatedItem.paguDalamDaerah,
        paguLuar: updatedItem.paguLuarDaerah,
        pptkNip: updatedItem.pptkNip
      });

      try {
        await updateSubKegiatan(isEditing, {
          paguDalamDaerah: updatedItem.paguDalamDaerah,
          paguLuarDaerah: updatedItem.paguLuarDaerah,
          pptkNip: updatedItem.pptkNip,
        });
        
        toast.success("Perubahan anggaran berhasil disimpan");
        setIsEditing(null);
        setEditForm({});
        await loadData();
      } catch (e) {
        console.error('[handleSaveEdit] Error saving:', e);
        toast.error("Gagal menyimpan perubahan. Silakan coba lagi.");
      }
    }
  };

  const handleAdd = () => {
    if (!addForm.kodeRekening || !addForm.namaSubKegiatanRaw || !addForm.program || !addForm.kegiatan) {
      toast.error("Kode Rekening, Program, Kegiatan, dan Sub Kegiatan wajib diisi");
      return;
    }
    
    const combinedNama = `${addForm.kodeRekening} - ${addForm.namaSubKegiatanRaw}`;
    const newId = combinedNama;
    
    const newSk: SubKegiatan = {
      id: newId,
      program: addForm.program,
      kegiatan: addForm.kegiatan,
      nama: combinedNama,
      paguDalamDaerah: addForm.paguDalamDaerah || 0,
      realisasiDalamDaerah: 0,
      paguLuarDaerah: addForm.paguLuarDaerah || 0,
      realisasiLuarDaerah: 0,
      pengelolaNips: [],
      pptkNip: addForm.pptkNip || ""
    };
    addSubKegiatan(newSk);
    toast.success("Sub Kegiatan berhasil ditambahkan");
    setIsAdding(false);
    setAddForm({
      id: "", nama: "", program: "", kegiatan: "", kodeRekening: "", namaSubKegiatanRaw: "",
      paguDalamDaerah: 0, paguLuarDaerah: 0, pptkNip: ""
    });
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus Sub Kegiatan ini?")) {
      deleteSubKegiatan(id);
      toast.success("Sub Kegiatan berhasil dihapus");
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />

      <main className="ml-64 pt-20 p-8 min-h-screen">
        <header className="mb-10">
          <p className="text-[#4c616d] font-semibold uppercase tracking-[0.15em] text-[10px] mb-2">Selamat Datang</p>
          <h2 className="text-4xl font-bold tracking-tight text-[#00475e] mb-1">Dashboard Bendahara</h2>
          <p className="text-[#40484d] max-w-2xl">
            Kelola pagu anggaran, realisasi, dan penugasan PPTK untuk seluruh Sub Kegiatan.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-xl font-bold text-[#00475e]">Monitoring Anggaran Sub Kegiatan</h3>
              <p className="text-sm text-slate-500 mt-1">Daftar seluruh sub kegiatan beserta pagu dan realisasinya</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-[#00475e] text-white rounded-xl text-sm font-bold hover:bg-[#1a5f7a] shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Sub Kegiatan
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f6]">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub Kegiatan</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pagu</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Realisasi</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Realisasi (%)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sisa Anggaran</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">PPTK (NIP)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isAdding && (
                  <tr className="bg-blue-50/50">
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kode Rekening</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: 2.17.07..."
                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-[#00475e]/20 outline-none"
                            value={addForm.kodeRekening || ""}
                            onChange={(e) => setAddForm({...addForm, kodeRekening: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Program</label>
                          <input 
                            type="text" 
                            placeholder="Nama Program..."
                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-[#00475e]/20 outline-none"
                            value={addForm.program || ""}
                            onChange={(e) => setAddForm({...addForm, program: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Kegiatan</label>
                          <input 
                            type="text" 
                            placeholder="Nama Kegiatan..."
                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-[#00475e]/20 outline-none"
                            value={addForm.kegiatan || ""}
                            onChange={(e) => setAddForm({...addForm, kegiatan: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Sub Kegiatan</label>
                          <input 
                            type="text" 
                            placeholder="Nama Sub Kegiatan..."
                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-[#00475e]/20 outline-none"
                            value={addForm.namaSubKegiatanRaw || ""}
                            onChange={(e) => setAddForm({...addForm, namaSubKegiatanRaw: e.target.value})}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Dalam Daerah</label>
                          <input 
                            type="number" 
                            className="w-full text-sm p-2 border rounded"
                            value={addForm.paguDalamDaerah}
                            onChange={(e) => setAddForm({...addForm, paguDalamDaerah: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Luar Daerah</label>
                          <input 
                            type="number" 
                            className="w-full text-sm p-2 border rounded"
                            value={addForm.paguLuarDaerah}
                            onChange={(e) => setAddForm({...addForm, paguLuarDaerah: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="space-y-4">
                        <div>Rp 0</div>
                        <div>Rp 0</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-right">
                      <div className="space-y-4 text-sm font-medium">
                        <div>0.0%</div>
                        <div>0.0%</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="space-y-4">
                        <div>-</div>
                        <div>-</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        className="w-full text-sm p-2 border rounded"
                        value={addForm.pptkNip}
                        onChange={(e) => setAddForm({...addForm, pptkNip: e.target.value})}
                      >
                        <option value="">-- Pilih PPTK --</option>
                        {availablePPTK.map(p => (
                          <option key={p.nip} value={p.nip}>{p.nama}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={handleAdd} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Simpan</button>
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-xs">Batal</button>
                      </div>
                    </td>
                  </tr>
                )}
                {data.map((item) => {
                  const percentDalam = item.paguDalamDaerah > 0 ? ((item.realisasiDalamDaerah / item.paguDalamDaerah) * 100).toFixed(1) : "0.0";
                  const percentLuar = item.paguLuarDaerah > 0 ? ((item.realisasiLuarDaerah / item.paguLuarDaerah) * 100).toFixed(1) : "0.0";
                  
                  return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#00475e] text-sm max-w-xs truncate" title={item.nama}>
                      {item.nama}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {isEditing === item.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24 text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded">Dalam Daerah</span>
                            <input 
                              type="number" 
                              className="w-full text-sm p-1 border rounded"
                              value={editForm.paguDalamDaerah ?? item.paguDalamDaerah}
                              onChange={(e) => setEditForm({...editForm, paguDalamDaerah: Number(e.target.value)})}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24 text-green-700 font-bold bg-green-100 px-2 py-1 rounded">Luar Daerah</span>
                            <input 
                              type="number" 
                              className="w-full text-sm p-1 border rounded"
                              value={editForm.paguLuarDaerah ?? item.paguLuarDaerah}
                              onChange={(e) => setEditForm({...editForm, paguLuarDaerah: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-blue-700 font-bold text-xs bg-blue-50 px-2 rounded-full mr-2">Dalam</span>
                            <span>Rp {item.paguDalamDaerah.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700 font-bold text-xs bg-green-50 px-2 rounded-full mr-2">Luar</span>
                            <span>Rp {item.paguLuarDaerah.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <div className="space-y-2 text-sm">
                        <div className="border-b pb-1 flex justify-end">
                          Rp {item.realisasiDalamDaerah.toLocaleString('id-ID')}
                        </div>
                        <div className="flex justify-end">
                          Rp {item.realisasiLuarDaerah.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500">
                      <div className="space-y-2 text-sm">
                        <div className="border-b pb-1 flex justify-end">
                          {percentDalam}%
                        </div>
                        <div className="flex justify-end">
                          {percentLuar}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#5f3800]">
                      <div className="space-y-2 text-sm">
                        <div className="border-b pb-1 flex justify-end">
                          Rp {(item.paguDalamDaerah - item.realisasiDalamDaerah).toLocaleString('id-ID')}
                        </div>
                        <div className="flex justify-end">
                          Rp {(item.paguLuarDaerah - item.realisasiLuarDaerah).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing === item.id ? (
                        <select 
                          className="w-full text-sm p-1 border rounded"
                          value={editForm.pptkNip ?? item.pptkNip}
                          onChange={(e) => setEditForm({...editForm, pptkNip: e.target.value})}
                        >
                          <option value="">-- Kosong --</option>
                          {availablePPTK.map(p => (
                            <option key={p.nip} value={p.nip}>{p.nama}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm">{availablePPTK.find(p => p.nip === item.pptkNip)?.nama || item.pptkNip || "Belum Ditugaskan"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center align-top">
                      {isEditing === item.id ? (
                        <div className="flex flex-col gap-2 justify-center">
                          <button onClick={handleSaveEdit} className="px-3 py-1 bg-[#00475e] text-white rounded text-xs font-bold hover:bg-[#1a5f7a]">Simpan</button>
                          <button onClick={() => setIsEditing(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300">Batal</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => {
                              setIsEditing(item.id);
                              setEditForm({ 
                                paguDalamDaerah: item.paguDalamDaerah, 
                                paguLuarDaerah: item.paguLuarDaerah,
                                pptkNip: item.pptkNip 
                              });
                            }} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Data"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
                {data.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data Sub Kegiatan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          <ProfileCard />
          <ActivityFeed />
        </div>
      </div>
      </main>
    </div>
  );
}
