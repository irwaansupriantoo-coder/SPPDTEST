import { createClient } from '@supabase/supabase-js';

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

async function test() {
  const payload = {
    nip: 'admin',
    nama: 'Administrator',
    email: 'admin@berau.go.id',
    role: 'admin',
    jabatan: 'Administrator',
    pangkat: '-'
  };

  const res = await fetch(`${SERVER_BASE}/pegawai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("POST /pegawai response:", text);
}

test();
