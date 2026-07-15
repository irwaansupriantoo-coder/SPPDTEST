import { apiRequest } from './src/app/utils/supabaseClient.ts';
async function test() {
  const { data } = await apiRequest('/pengajuan') as any;
  console.log("Total entries:", data.length);
  const sppds = data.map((d: any) => d.noSppd);
  console.log("Unique SPPDs:", new Set(sppds).size);
  
  // count occurrences
  const counts: Record<string, number> = {};
  for (let s of sppds) counts[s] = (counts[s] || 0) + 1;
  console.log(counts);
}
test();
