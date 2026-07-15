import { getSupabaseClient, SERVER_BASE } from './src/app/utils/supabaseClient';
import { publicAnonKey } from './utils/supabase/info';

async function testDelete() {
  console.log("Testing DELETE...");
  try {
    const res = await fetch(`${SERVER_BASE}/pengajuan`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`
      }
    });
    console.log("Status:", res.status);
    console.log("Text:", await res.text());
  } catch (e) {
    console.error(e);
  }
}

testDelete();
