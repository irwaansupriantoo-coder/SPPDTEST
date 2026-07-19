const { createClient } = require('@supabase/supabase-js');
const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function check() {
  const noSppd = "094/00001/SPPD-V2/2026";
  
  const { data: d1, error: e1 } = await supabase.from('pengajuan_sppd').select('status').eq('no_sppd', noSppd).single();
  console.log('pengajuan_sppd:', d1, e1);
  
  const { data: d2, error: e2 } = await supabase.from('sppd_statuses').select('*').eq('no_sppd', noSppd).single();
  console.log('sppd_statuses:', d2, e2);
  
  // Try to update
  const { error: e3 } = await supabase.from('sppd_statuses').upsert({ no_sppd: noSppd, status: 'Disetujui' }, { onConflict: 'no_sppd' });
  console.log('upsert error sppd_statuses:', e3);
}

check();
