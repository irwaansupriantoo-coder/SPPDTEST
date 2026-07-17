const { createClient } = require('@supabase/supabase-js');

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

const DEMO_ACCOUNTS = [
  { nip: '198202082005021002', password: 'Diskoperindag123', nama: 'Wahid Hasyim', role: 'kpa', pangkat: 'Penata Tk. I / III.d' },
  { nip: '199509012022031013', password: 'Diskoperindag123', nama: 'Irwan Suprianto', role: 'pptk', pangkat: 'Penata Muda / III.a' },
  { nip: '199511302022032030', password: 'Diskoperindag123', nama: 'Rahmawati', role: 'pptk', pangkat: 'Penata Muda / III.a' },
  { nip: '199106272023211019', password: 'Diskoperindag123', nama: 'Wenry Adeputra', role: 'bendahara', pangkat: 'IX' },
  { nip: '199201242023211018', password: 'Diskoperindag123', nama: 'Rijal Rasyidin', role: 'pengelola', pangkat: 'IX' },
  { nip: '199706102025211001', password: 'Diskoperindag123', nama: 'Deny Cahyadi', role: 'pengelola', pangkat: 'IX' },
  { nip: '199904282025212020', password: 'Diskoperindag123', nama: 'Annisa Apriani', role: 'pengelola', pangkat: 'V' },
  { nip: '197206132007011023', password: 'Diskoperindag123', nama: 'Darwis Iskandar', role: 'pegawai', pangkat: 'Pengatur Tk. I/II.b' },
  { nip: '197701182008011015', password: 'Diskoperindag123', nama: 'Rachmat Arianto', role: 'pegawai', pangkat: 'Penata/III.c' },
  { nip: '198211232011012004', password: 'Diskoperindag123', nama: 'Noveria Devy Irmawanti', role: 'pegawai', pangkat: 'Penata Tk. I / III.d' },
  { nip: '198703282025212003', password: 'Diskoperindag123', nama: 'Sitti Halimatussa\'diyah Badar', role: 'pegawai', pangkat: 'IX' },
  { nip: '198804082022032007', password: 'Diskoperindag123', nama: 'Marlina', role: 'pegawai', pangkat: 'Penata Muda / III.a' },
  { nip: '199704262023212014', password: 'Diskoperindag123', nama: 'Evita Tiara Jayanti', role: 'pegawai', pangkat: 'IX' },
  { nip: '199707112023212021', password: 'Diskoperindag123', nama: 'Fauziani Nur Maulidianti', role: 'pegawai', pangkat: 'IX' },
  { nip: '199711272022031009', password: 'Diskoperindag123', nama: 'Nova Dwi Sapta Nain Seven', role: 'pegawai', pangkat: 'Penata Muda / III.a' },
  { nip: '198704082009041002', password: 'Diskoperindag123', nama: 'Hidayat Sorang', role: 'pegawai', pangkat: 'Penata Tk. I / III.d' },
  { nip: '197406202007011015', password: 'Diskoperindag123', nama: 'Muhammad Sulaiman', role: 'pegawai', pangkat: 'Penata Muda / III.a' },
  { nip: '196908032000121006', password: 'Diskoperindag123', nama: 'Agus Susanto', role: 'pegawai', pangkat: 'Penata Muda / IIIa' },
  { nip: 'MuriAsdanu', password: 'Diskoperindag123', nama: 'Muri Asdanu', role: 'pegawai', pangkat: '-' },
  { nip: 'MuhammadFadli', password: 'Diskoperindag123', nama: 'Muhammad Fadli', role: 'pegawai', pangkat: '-' },
];

const EMAIL_MAP = {
  '198202082005021002': 'wahid@berau.go.id',
  '199509012022031013': 'irwan@berau.go.id',
  '199511302022032030': 'rahmawati@berau.go.id',
  '199106272023211019': 'wenry@berau.go.id',
  '199201242023211018': 'rijal@berau.go.id',
  '199706102025211001': 'deny@berau.go.id',
  '199904282025212020': 'annisa@berau.go.id',
};

async function createAccounts() {
  console.log("Starting account creation...");
  let successCount = 0;
  for (const acc of DEMO_ACCOUNTS) {
    const email = EMAIL_MAP[acc.nip] || `${acc.nip.toLowerCase()}@berau.go.id`;
    
    // Check if exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: acc.password
    });

    if (signInData.session) {
      console.log(`[INFO] Account already exists and works: ${acc.nama} (${email})`);
      
      // Update metadata to ensure it's up to date
      await supabase.auth.updateUser({
        data: {
          nama: acc.nama,
          nip: acc.nip,
          role: acc.role,
          pangkat: acc.pangkat
        }
      });
      successCount++;
      await supabase.auth.signOut();
      continue;
    }

    console.log(`[+] Registering: ${acc.nama} (${email})`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: acc.password,
      options: {
        data: {
          nama: acc.nama,
          nip: acc.nip,
          role: acc.role,
          pangkat: acc.pangkat
        }
      }
    });

    if (error) {
      console.error(`[-] Failed for ${acc.nama}: ${error.message}`);
    } else {
      console.log(`[+] Success for ${acc.nama}`);
      successCount++;
      if (data.session) {
          await supabase.auth.signOut();
      }
    }
  }
  console.log(`\nCreation complete. Successfully processed ${successCount}/${DEMO_ACCOUNTS.length} accounts.`);
}

createAccounts();
