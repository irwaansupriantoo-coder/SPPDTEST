const { createClient } = require('@supabase/supabase-js');
const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'hidayat@berau.go.id',
    password: 'hidayat123'
  });
  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }
  
  console.log('Logged in as:', auth.user.email);
  
  const noSppd = "094/00001/SPPD-V2/2026";
  const { data, error } = await supabase.from('sppd_statuses').upsert(
    { no_sppd: noSppd, status: 'Disetujui', approval_date: new Date().toISOString() },
    { onConflict: 'no_sppd' }
  );
  
  console.log('Upsert result:', data, error);
}

run();
