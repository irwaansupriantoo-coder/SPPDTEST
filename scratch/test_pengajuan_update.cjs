const { createClient } = require('@supabase/supabase-js');
const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function check() {
  const { data, error } = await supabase.from('pengajuan_sppd').update({ status: 'Disetujui' }).eq('id', '360699df-fbf6-41f2-95f3-f86a958e8055');
  console.log('Update pengajuan_sppd with Disetujui:', error);
}

check();
