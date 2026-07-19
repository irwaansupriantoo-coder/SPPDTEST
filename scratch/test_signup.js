import { createClient } from '@supabase/supabase-js';

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@berau.go.id',
    password: 'admin',
    options: {
      data: {
        nama: 'Administrator',
        nip: 'admin',
        role: 'admin'
      }
    }
  });

  console.log("Signup error:", error?.message);
  console.log("Signup data:", !!data?.user);
}

test();
