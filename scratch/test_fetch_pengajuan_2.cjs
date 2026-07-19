const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

async function test() {
  const res = await fetch(`${SERVER_BASE}/pengajuan`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  const data = await res.json();
  console.log("Total entries:", data.total);
  if (data.data && data.data.length > 0) {
    console.log("Sample pembuat:", JSON.stringify(data.data[0].pembuat, null, 2));
  }
}

test();
