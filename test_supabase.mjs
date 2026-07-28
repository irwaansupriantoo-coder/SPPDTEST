import { createClient } from '@supabase/supabase-js';

const projectId = "wbywplnorujaidmvtcai";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXdwbG5vcnVqYWlkbXZ0Y2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTM4MjYsImV4cCI6MjA5OTY2OTgyNn0.xP38PAyWuPh8Cn6MxmAL4R95eLq-5nk87jXuQr344tQ";

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.storage.from('sppd-documents').list('', { limit: 100 });
  console.log('Root list:', data?.map(d => d.name));
  
  // Try to search a known SPPD format if we know one, but we don't.
  // We can just recursively list all files to see what's in the bucket!
  const listAllFiles = async (path = '') => {
    let allFiles = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.storage.from('sppd-documents').list(path, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        for (const item of data) {
          if (!item.id || item.metadata === null) {
            const subPath = path ? `${path}/${item.name}` : item.name;
            const subFiles = await listAllFiles(subPath);
            allFiles = [...allFiles, ...subFiles];
          } else {
            const fullPath = path ? `${path}/${item.name}` : item.name;
            allFiles.push(fullPath);
          }
        }
        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
    }
    return allFiles;
  };
  
  const all = await listAllFiles();
  console.log('All files:', all.slice(0, 20)); // print first 20
}
test();
