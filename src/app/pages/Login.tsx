import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { getSupabaseClient, apiRequest } from '../utils/supabaseClient';
import { logActivity } from '../utils/activityStore';
import { getUserProfile } from '../utils/supabaseDataStore';

const DEMO_ACCOUNTS = [
  { nip: '198202082005021002', password: 'Diskoperindag123', nama: 'Wahid Hasyim', role: 'kpa' },
  { nip: '199509012022031013', password: 'Diskoperindag123', nama: 'Irwan Suprianto', role: 'pptk' },
  { nip: '199511302022032030', password: 'Diskoperindag123', nama: 'Rahmawati', role: 'pptk' },
  { nip: '199106272023211019', password: 'Diskoperindag123', nama: 'Wenry Adeputra', role: 'bendahara' },
  { nip: '199201242023211018', password: 'Diskoperindag123', nama: 'Rijal Rasyidin', role: 'pengelola' },
  { nip: '199706102025211001', password: 'Diskoperindag123', nama: 'Deny Cahyadi', role: 'pengelola' },
  { nip: '199904282025212020', password: 'Diskoperindag123', nama: 'Annisa Apriani', role: 'pengelola' },
  { nip: '197206132007011023', password: 'Diskoperindag123', nama: 'Darwis Iskandar', role: 'pegawai' },
  { nip: '197701182008011015', password: 'Diskoperindag123', nama: 'Rachmat Arianto', role: 'pegawai' },
  { nip: '198211232011012004', password: 'Diskoperindag123', nama: 'Noveria Devy Irmawanti', role: 'pegawai' },
  { nip: '198703282025212003', password: 'Diskoperindag123', nama: 'Sitti Halimatussa\'diyah Badar', role: 'pegawai' },
  { nip: '198804082022032007', password: 'Diskoperindag123', nama: 'Marlina', role: 'pegawai' },
  { nip: '199704262023212014', password: 'Diskoperindag123', nama: 'Evita Tiara Jayanti', role: 'pegawai' },
  { nip: '199707112023212021', password: 'Diskoperindag123', nama: 'Fauziani Nur Maulidianti', role: 'pegawai' },
  { nip: '199711272022031009', password: 'Diskoperindag123', nama: 'Nova Dwi Sapta Nain Seven', role: 'pegawai' },
  { nip: '198704082009041002', password: 'Diskoperindag123', nama: 'Hidayat Sorang', role: 'pegawai' },
  { nip: '197406202007011015', password: 'Diskoperindag123', nama: 'Muhammad Sulaiman', role: 'pegawai' },
  { nip: '196908032000121006', password: 'Diskoperindag123', nama: 'Agus Susanto', role: 'pegawai' },
  { nip: 'MuriAsdanu', password: 'Diskoperindag123', nama: 'Muri Asdanu', role: 'pegawai' },
  { nip: 'MuhammadFadli', password: 'Diskoperindag123', nama: 'Muhammad Fadli', role: 'pegawai' },
  { nip: 'admin', password: 'admin', nama: 'Administrator', role: 'admin' }
];

// NIP â†’ email mapping (known ahead of time)
const EMAIL_MAP: Record<string, string> = {
  '198202082005021002': 'wahid@berau.go.id',
  '199509012022031013': 'irwan@berau.go.id',
  '199511302022032030': 'rahmawati@berau.go.id',
  '199106272023211019': 'wenry@berau.go.id',
  '199201242023211018': 'rijal@berau.go.id',
  '199706102025211001': 'deny@berau.go.id',
  '199904282025212020': 'annisa@berau.go.id',
};

export default function Login() {
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logLogin = (user: { nama: string; nip: string, role?: string }) => {
    logActivity('login', `${user.nama} Login`, 'Sistem', undefined, {
      nama: user.nama,
      nip: user.nip,
      role: user.role || 'pegawai'
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nip || !password) {
      toast.error('NIP dan Password harus diisi');
      return;
    }

    setIsLoading(true);

    const localUser = DEMO_ACCOUNTS.find(a => a.nip === nip);

    // ── Layer 1: server endpoint (handles BOTH demo + dynamically-created users) ──
    try {
      const result = await apiRequest<{
        session: { access_token: string; refresh_token: string };
        user: { nama: string; nip: string; role: string };
      }>('/auth/login-nip', {
        method: 'POST',
        body: JSON.stringify({ nip, password }),
      });

      await getSupabaseClient().auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      const existingProfile = await getUserProfile(nip) || {};
      const serverUser = {
        ...result.user,
        nama: existingProfile.nama || result.user.nama,
        nip,
        role: result.user.role,
        pangkat: existingProfile.pangkat || (result.user as any).pangkat,
        profilePicture: existingProfile.profilePicture
      };
      await getSupabaseClient().auth.updateUser({ data: serverUser });

      logLogin(serverUser);
      toast.success(`Selamat datang, ${serverUser.nama}!`);
      setTimeout(() => navigate('/dashboard'), 800);
      return;
    } catch (serverErr: any) {
      const errMsg = serverErr?.message || '';
      if (errMsg.includes('NIP tidak terdaftar')) {
        if (!localUser) {
          toast.error('NIP tidak terdaftar dalam sistem');
          setIsLoading(false);
          return;
        }
      } else if (errMsg.includes('Password salah')) {
        toast.error('Password yang Anda masukkan salah!');
        setIsLoading(false);
        return;
      }
      console.log('Server login failed, trying local fallback:', errMsg);
    }

    // ── Layer 2: Local fallback (only for demo accounts when server is unreachable) ──
    if (!localUser) {
      toast.error('NIP tidak terdaftar dalam sistem');
      setIsLoading(false);
      return;
    }
    if (localUser.password !== password) {
      toast.error('Password yang Anda masukkan salah!');
      setIsLoading(false);
      return;
    }

    const existingProfile = await getUserProfile(nip) || {};

    const sessionUser = {
      nama: existingProfile.nama || localUser.nama,
      nip,
      role: localUser.role,
      pangkat: existingProfile.pangkat,
      profilePicture: existingProfile.profilePicture
    };

    let email = EMAIL_MAP[nip] || `${nip.toLowerCase()}@berau.go.id`;
    let sbPassword = password;

    if (nip === 'admin') {
      email = 'admin@berau.go.id';
      sbPassword = 'admin';
    }

    if (email) {
      try {
        let { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password: sbPassword });

        if (error && error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await getSupabaseClient().auth.signUp({
            email,
            password,
            options: {
              data: sessionUser
            }
          });

          if (signUpError) {
            console.error("Signup error:", signUpError);
            error = signUpError;
          } else if (signUpData.session) {
            data = signUpData as any;
            error = null;
          } else {
            toast.error('Akun berhasil dibuat tetapi membutuhkan verifikasi email. Matikan "Confirm email" di pengaturan Supabase Auth Anda.');
            setIsLoading(false);
            return;
          }
        }

        if (!error && data.session) {
          await getSupabaseClient().auth.updateUser({ data: sessionUser });

          logLogin(sessionUser);
          toast.success(`Selamat datang, ${sessionUser.nama}!`);
          setTimeout(() => navigate('/dashboard'), 800);
          return;
        } else if (error) {
          console.error("Auth error:", error);
          toast.error(`Login gagal: ${error.message}`);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        console.error("Auth exception", err);
        toast.error(`Error: ${err.message}`);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    toast.error('Gagal masuk ke sistem. Pastikan koneksi internet stabil atau cek konfigurasi database.');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white">
      <Toaster position="top-center" richColors />

      {/* Left side - Background Image */}
      <div
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: `url('/fotologin.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h1 className="text-4xl font-bold mb-4">Portal Resmi</h1>
          <p className="text-lg opacity-90 max-w-lg">Akses sistem manajemen administrasi perjalanan dinas terpadu untuk efisiensi dan transparansi birokrasi.</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-10">
            <img src="/logo-berau-1.png" alt="Logo Kabupaten Berau" className="h-24 w-auto object-contain mx-auto mb-6" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Sistem Informasi<br />Manajemen<br />Perjalanan Dinas</h1>
            <p className="text-gray-500 font-medium mt-4">Diskoperindag Kabupaten Berau</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* NIP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="nip">
                  NIP
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    id="nip"
                    type="text"
                    placeholder="Masukkan Nomor Induk Pegawai"
                    value={nip}
                    onChange={e => setNip(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 transition-all outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-11 pr-11 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 transition-all outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-[#0a0a0a] shadow-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50" />
                <span className="text-gray-600">Ingat saya</span>
              </label>
              <a href="#" className="font-semibold text-[#3b5998] hover:text-[#2d4373]">
                Lupa Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0a0a0a] hover:bg-black text-white font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-8"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></>
                : <><span>Masuk ke Sistem</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-12 font-medium">
            &copy; 2026 Diskoperindag Kabupaten Berau
          </p>
        </div>
      </div>
    </div>
  );
}
