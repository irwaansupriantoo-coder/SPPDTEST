import { useState, useEffect } from 'react';
import { AVAILABLE_PEGAWAI } from '../utils/pegawai';
import { X, Upload, Save, User, Hash, Briefcase } from 'lucide-react';

export function ProfileCard() {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    pangkat: '',
    profilePicture: ''
  });

  useEffect(() => {
    if (user) {
      const foundPegawai = AVAILABLE_PEGAWAI.find(p => p.nip === user.nip);
      setFormData({
        nama: user.nama || '',
        nip: user.nip || '',
        pangkat: user.pangkat || foundPegawai?.pangkat || '',
        profilePicture: user.profilePicture || ''
      });
    }
  }, [user]);

  // Listen to external updates if needed
  useEffect(() => {
    const handleStorageChange = () => {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    };
    window.addEventListener('user-updated', handleStorageChange);
    return () => window.removeEventListener('user-updated', handleStorageChange);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (user) {
      const updatedUser = {
        ...user,
        nama: formData.nama,
        nip: formData.nip,
        pangkat: formData.pangkat,
        profilePicture: formData.profilePicture,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsModalOpen(false);

      // Persist across logouts
      try {
        const savedProfilesJson = localStorage.getItem('user_profiles') || '{}';
        const savedProfiles = JSON.parse(savedProfilesJson);
        savedProfiles[updatedUser.nip] = {
          nama: updatedUser.nama,
          pangkat: updatedUser.pangkat,
          profilePicture: updatedUser.profilePicture
        };
        localStorage.setItem('user_profiles', JSON.stringify(savedProfiles));
      } catch (e) {
        console.error("Failed to save profile persistence", e);
      }
      
      window.dispatchEvent(new Event('user-updated'));
    }
  };

  const roleDisplay = user?.role === 'pengelola' ? 'Pengelola SPPD' : user?.role === 'kpa' ? 'Kuasa Pengguna Anggaran' : user?.role === 'pptk' ? 'Pejabat Pelaksana Teknis Kegiatan' : 'Pegawai';
  
  const foundPegawai = AVAILABLE_PEGAWAI.find(p => p.nip === user?.nip);
  const displayPangkat = user?.pangkat || foundPegawai?.pangkat || '-';
  const displayFoto = user?.profilePicture || "https://images.unsplash.com/photo-1648448942225-7aa06c7e8f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJbmRvbmVzaWFuJTIwbWFsZSUyMHByb2Zlc3Npb25hbCUyMG9mZmljZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTIwOTg5Mnww&ixlib=rb-4.1.0&q=80&w=1080";

  // Mapping PPTK NIP to Name
  const PPTK_MAP: Record<string, string> = {
    '199509012022031013': 'Irwan Suprianto',
    '199511302022032030': 'Rahmawati'
  };

  let pptkName = '-';
  if (user?.role === 'pengelola') {
    try {
      const stored = localStorage.getItem('sppd_sub_kegiatan_data');
      if (stored) {
        const subKegiatans = JSON.parse(stored);
        const managed = subKegiatans.find((sk: any) => sk.pengelolaNips?.includes(user?.nip));
        if (managed && managed.pptkNip) {
          pptkName = PPTK_MAP[managed.pptkNip] || managed.pptkNip;
        }
      }
    } catch (e) {}
  }

  return (
    <>
      <section className="bg-gradient-to-br from-[#00475e] to-[#1a5f7a] p-8 rounded-xl text-white shadow-xl shadow-[#00475e]/10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img 
              alt={user?.nama || "User"} 
              className="w-24 h-24 rounded-full border-4 border-white/20 object-cover bg-white/10" 
              src={displayFoto}
            />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <h3 className="text-xl font-bold">{user?.nama || 'User'}</h3>
          {user?.nip && <p className="text-sm text-white/80 font-medium mt-0.5">{user.nip}</p>}
          {displayPangkat !== '-' && (
            <p className="text-sm text-[#92cfee] font-medium mt-0.5">{displayPangkat}</p>
          )}
          <p className="text-[#92cfee] text-xs font-medium uppercase tracking-widest mt-1">{roleDisplay}</p>
          
          {user?.role === 'pengelola' && (
            <div className="w-full mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
              <p className="text-[10px] text-white/60 font-bold uppercase">PPTK</p>
              <p className="text-sm font-semibold">{pptkName}</p>
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold transition-all"
          >
            Kelola Profil Akun
          </button>
        </div>
      </section>

      {/* Modal Kelola Profil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-[#00475e]">Kelola Profil Akun</h3>
                <p className="text-sm text-slate-500 mt-1">Perbarui informasi profil Anda</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="flex flex-col items-center justify-center space-y-4 mb-4">
                <div className="relative group">
                  <img
                    src={formData.profilePicture || "https://images.unsplash.com/photo-1648448942225-7aa06c7e8f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJbmRvbmVzaWFuJTIwbWFsZSUyMHByb2Zlc3Npb25hbCUyMG9mZmljZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTIwOTg5Mnww&ixlib=rb-4.1.0&q=80&w=1080"}
                    alt="Profile Preview"
                    className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover shadow-sm transition-opacity group-hover:opacity-75"
                  />
                  <label htmlFor="foto-upload" className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Ubah Foto</span>
                  </label>
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Foto Profil</p>
                  <p className="text-xs text-slate-500">Klik gambar di atas untuk mengubah foto</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00475e]" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan Nama Lengkap"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00475e] focus:border-[#00475e] outline-none transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#00475e]" /> NIP
                </label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  placeholder="Masukkan NIP"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00475e] focus:border-[#00475e] outline-none transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#00475e]" /> Pangkat/Gol
                </label>
                <input
                  type="text"
                  name="pangkat"
                  value={formData.pangkat}
                  onChange={handleChange}
                  placeholder="Masukkan Pangkat/Gol"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#00475e] focus:border-[#00475e] outline-none transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#00475e] rounded-xl hover:bg-[#1a5f7a] transition-colors flex items-center gap-2 shadow-lg shadow-[#00475e]/20"
              >
                <Save className="w-4 h-4" /> Perbarui Profil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

