import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
const sb = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function fix() {
  const { data, error } = await sb.from('sppd_pegawai_approvals').delete().eq('no_sppd', '094/00016/SPPD-V2/2026');
  console.log('Error:', error);
  console.log('Success, data:', data);
}
fix();