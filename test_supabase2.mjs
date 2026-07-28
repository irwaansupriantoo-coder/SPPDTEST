import { createClient } from '@supabase/supabase-js';

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: urlData, error: urlError } = await supabase.storage.from('sppd-documents').createSignedUrl('nonexistent_file.txt', 3600);
  console.log('Dummy signed url:', urlData, urlError);
}
test();
