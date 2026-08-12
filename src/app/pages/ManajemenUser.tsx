import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Users, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { apiRequest } from '../utils/supabaseClient';

interface UserData {
  nama: string;
  nip: string;
  pangkat: string;
  jabatan: string;
  role: string;
  bidang: string;
}

const ROLES = ['KPA', 'PPTK', 'BENDAHARA', 'PENGELOLA', 'PEGAWAI', 'ADMIN'];
const BIDANGS = [
  'Bidang Industri', 
  'Bidang Koperasi dan UMKM', 
  'Bidang Usaha Perdagangan', 
  'Bidang Sarana Perdagangan', 
  'Sekretariat', 
  'UPT. Meteorologi', 
  'UPT. Pasar Sanggam Aji Dilayas'
];

export default function ManajemenUser() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState<UserData>({
    nama: '',
    nip: '',
    pangkat: '',
    jabatan: '',
    role: 'PENGELOLA',
    bidang: 'Bidang Industri',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<UserData[]>('/users');
      setUsers(data || []);
    } catch (error) {
      toast.error('Gagal mengambil data user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditMode(true);
      setFormData({
        nama: user.nama || '',
        nip: user.nip || '',
        pangkat: user.pangkat || '',
        jabatan: user.jabatan || '',
        role: user.role?.toUpperCase() || 'PENGELOLA',
        bidang: user.bidang || 'Bidang Industri',
      });
    } else {
      setEditMode(false);
      setFormData({
        nama: '',
        nip: '',
        pangkat: '',
        jabatan: '',
        role: 'PENGELOLA',
        bidang: 'Bidang Industri',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Role in db is lowercase usually, we can lowercase it
      const payload = {
        ...formData,
        role: formData.role.toLowerCase()
      };

      if (editMode) {
        await apiRequest(`/users/${formData.nip}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('User berhasil diperbarui');
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('User berhasil ditambahkan');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (nip: string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user ${nama}?`)) return;
    
    try {
      await apiRequest(`/users/${nip}`, {
        method: 'DELETE'
      });
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (error: any) {
      toast.error(`Gagal menghapus: ${error.message}`);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.nip || '').includes(searchQuery) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Toaster position="top-right" richColors />
      <Header />
      <Sidebar />
      <main className="w-full lg:w-[calc(100%-16rem)] lg:ml-64 pt-24 pb-16 px-4 lg:px-8 transition-all duration-300">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[#00475e] tracking-tight">Manajemen User</h2>
              <p className="text-[#40484d] mt-1">Kelola data pengguna aplikasi.</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00475e] text-white rounded-xl text-sm font-bold hover:bg-[#00384a] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Tambah User
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
              <div className="relative w-full max-w-md">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Cari berdasarkan nama, NIP, atau role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm"
                />
              </div>
              <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                Total: {filteredUsers.length} User
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Nama & Gelar</th>
                    <th className="px-6 py-4 font-bold tracking-wider">NIP</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Jabatan & Pangkat</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Bidang</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                          <p>Tidak ada pengguna ditemukan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{user.nama}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.nip}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">{user.jabatan || '-'}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{user.pangkat || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-[#00475e]/10 text-[#00475e] text-xs font-bold rounded-md uppercase tracking-wide">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.bidang || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-2 text-slate-400 hover:text-[#00475e] hover:bg-[#00475e]/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.nip, user.nama)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-[#00475e]">
                {editMode ? 'Edit User' : 'Tambah User'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Nama Lengkap (dengan Gelar) <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      value={formData.nama}
                      onChange={e => setFormData({...formData, nama: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm"
                      placeholder="Contoh: Dr. H. Irwan, S.Kom"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">NIP <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      disabled={editMode}
                      value={formData.nip}
                      onChange={e => setFormData({...formData, nip: e.target.value})}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm ${editMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      placeholder="Contoh: 199001012020121001"
                    />
                    {editMode && <p className="text-[10px] text-slate-500">NIP tidak dapat diubah.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Pangkat / Golongan</label>
                    <input 
                      type="text" 
                      value={formData.pangkat}
                      onChange={e => setFormData({...formData, pangkat: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm"
                      placeholder="Contoh: Penata / III.c"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Jabatan</label>
                    <input 
                      type="text" 
                      value={formData.jabatan}
                      onChange={e => setFormData({...formData, jabatan: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm"
                      placeholder="Contoh: Kepala Bidang"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Role User <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm bg-white"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Bidang</label>
                    <select
                      value={formData.bidang}
                      onChange={e => setFormData({...formData, bidang: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00475e] text-sm bg-white"
                    >
                      <option value="">- Pilih Bidang -</option>
                      {BIDANGS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  
                  {!editMode && (
                    <div className="space-y-1.5 md:col-span-2">
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <strong>Info:</strong> Akun yang dibuat akan memiliki password default: <code className="font-bold bg-white px-1 rounded">Diskoperindag123</code>
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                form="user-form"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold bg-[#00475e] text-white rounded-lg hover:bg-[#00384a] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
