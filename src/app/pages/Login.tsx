import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
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

// NIP → email mapping (known ahead of time)
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

    // Validate NIP + password locally first — no network needed
    const localUser = DEMO_ACCOUNTS.find(a => a.nip === nip);
    if (!localUser) {
      toast.error('NIP tidak terdaftar dalam sistem');
      return;
    }
    if (localUser.password !== password) {
      toast.error('Password yang Anda masukkan salah!');
      return;
    }

    setIsLoading(true);

    // Fetch saved profile from Supabase
    const existingProfile = await getUserProfile(nip) || {};

    const sessionUser = { 
      nama: existingProfile.nama || localUser.nama, 
      nip, 
      role: localUser.role,
      pangkat: existingProfile.pangkat,
      profilePicture: existingProfile.profilePicture 
    };

    // ── Layer 1: server endpoint (creates Auth user if needed + returns session) ──
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

      const serverUser = { ...result.user, ...sessionUser, nama: sessionUser.nama || result.user.nama };
      localStorage.setItem('user', JSON.stringify(serverUser));
      logLogin(serverUser);
      toast.success(`Selamat datang, ${serverUser.nama}!`);
      setTimeout(() => navigate('/dashboard'), 800);
      return;
    } catch (_) {
      // server unreachable or not deployed — continue to next layer
    }

    // ── Layer 2: direct Supabase Auth (user already exists from a prior login) ──
    const email = EMAIL_MAP[nip];
    if (email) {
      try {
        const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
        if (!error && data.session) {
          localStorage.setItem('user', JSON.stringify(sessionUser));
          logLogin(sessionUser);
          toast.success(`Selamat datang, ${sessionUser.nama}!`);
          setTimeout(() => navigate('/dashboard'), 800);
          return;
        }
      } catch (_) {
        // Auth also failed — fall through
      }
    }

    // ── Layer 3: offline mode (Edge Function not deployed yet) ──
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('offline_mode', 'true');
    logLogin(sessionUser);
    toast.success(`Selamat datang, ${sessionUser.nama}!`);
    setTimeout(() => navigate('/dashboard'), 800);
  };



  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" richColors />
      <div className="absolute top-0 left-0 w-full h-96 bg-[#00475e] -skew-y-6 transform origin-top-left -translate-y-24 z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
            <img src="/logo-berau-1.png" alt="Logo Kabupaten Berau" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#00475e] mb-2">SIM Perjalanan Dinas</h1>
          <p className="text-[#00475e] font-medium">Diskoperindag Kabupaten Berau</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-[#00475e] mb-2">Selamat Datang</h2>
            <p className="text-sm text-[#4c616d]">Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* NIP */}
              <div>
                <label className="block text-xs font-bold text-[#4c616d] uppercase tracking-wider mb-2" htmlFor="nip">
                  Nomor Induk Pegawai
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4c616d]">
                    <Badge className="w-5 h-5" />
                  </span>
                  <input
                    id="nip"
                    type="text"
                    placeholder="Masukkan NIP Anda"
                    value={nip}
                    onChange={e => setNip(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#f7f9fb] border border-gray-200 rounded-xl text-[#00475e] font-medium placeholder:text-gray-400 focus:bg-white focus:border-[#00475e] focus:ring-4 focus:ring-[#00475e]/10 transition-all outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#4c616d] uppercase tracking-wider mb-2" htmlFor="password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4c616d]">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#f7f9fb] border border-gray-200 rounded-xl text-[#00475e] font-medium placeholder:text-gray-400 focus:bg-white focus:border-[#00475e] focus:ring-4 focus:ring-[#00475e]/10 transition-all outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>



            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#00475e] hover:bg-[#00384a] text-white font-bold rounded-xl shadow-lg shadow-[#00475e]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></>
                : <><span>Masuk ke Sistem</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4c616d] mt-8 font-medium">
          &copy; 2026 Diskoperindag Kabupaten Berau
        </p>
      </div>
    </div>
  );
}
