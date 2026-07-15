import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function deleteAll() {
  console.log("Attempting to delete from 'pengajuan' table directly...");
  const { data, error } = await supabase.from('pengajuan_sppd').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
  
  if (error) {
    console.error("Delete error:", error.message);
  } else {
    console.log("Delete successful!", data);
  }
}

deleteAll();
