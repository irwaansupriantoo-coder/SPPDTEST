import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { generateUUID } from './uuid';

// Use window-level singleton so HMR reloads don't create duplicate instances
declare global { interface Window { __sbClient?: SupabaseClient } }

export function getSupabaseClient(): SupabaseClient {
  if (!window.__sbClient) {
    window.__sbClient = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
  }
  return window.__sbClient;
}

export const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-e15eeec0`;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;

  // Abort after 8 seconds so the app never hangs on an unreachable server
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    let res: Response | null = null;
    let fetchError: Error | null = null;
    
    try {
      res = await fetch(`${SERVER_BASE}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch (e: any) {
      fetchError = e;
    }

    if (fetchError || !res?.ok) {
      const err = fetchError ? fetchError.message : await res!.text();
      const status = res ? res.status : 503;
      
      // Auto fallback for offline mode or when encountering missing records on the server 
      // (because the record was created locally in mock_pengajuan)
      if (fetchError || (status === 401 && localStorage.getItem('offline_mode') === 'true') || status === 404 || status === 500) {
        if (path === '/pengajuan' && options.method === 'POST') {
          const payload = JSON.parse(options.body as string);
          payload.id = generateUUID();
          payload.createdAt = new Date().toISOString();
          payload.status = 'belum_spj';
          
          delete payload.sptFileUrl;
          delete payload.dasarSuratFileUrl;

          const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
          existing.push(payload);
          localStorage.setItem('mock_pengajuan', JSON.stringify(existing));
          return { success: true, data: payload } as any;
        }
        if (path.startsWith('/pengajuan/') && options.method === 'PUT') {
          const parts = path.split('/');
          const id = parts[parts.length - 1];
          const payload = JSON.parse(options.body as string);
          
          const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
          const idx = existing.findIndex((e: any) => e.id === id);
          if (idx !== -1) {
            existing[idx] = { ...existing[idx], ...payload, updatedAt: new Date().toISOString() };
            localStorage.setItem('mock_pengajuan', JSON.stringify(existing));
            return { success: true, data: existing[idx] } as any;
          }
        }
        if (path.startsWith('/pengajuan/') && options.method === 'DELETE') {
          const parts = path.split('/');
          const id = parts[parts.length - 1];
          
          const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
          const newExisting = existing.filter((e: any) => e.id !== id);
          localStorage.setItem('mock_pengajuan', JSON.stringify(newExisting));
          return { success: true } as any;
        }
        if (path === '/pengajuan' && (!options.method || options.method === 'GET')) {
          const local = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
          return { success: true, data: local, total: local.length } as any;
        }
      }

      throw new Error(`API Error ${status}: ${err}`);
    }
    
    let result = await res!.json();
    
    // Always mirror POST/PUT/DELETE to local mock_pengajuan as a fallback
    // This handles edge cases where the backend returns 200 OK but drops payload fields due to schema mismatches.
    if (path === '/pengajuan' && options.method === 'POST') {
      try {
        const payload = JSON.parse(options.body as string);
        payload.id = result?.data?.id || generateUUID();
        payload.createdAt = new Date().toISOString();
        payload.status = 'belum_spj';
        delete payload.sptFileUrl;
        delete payload.dasarSuratFileUrl;
        const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
        // Only add if not already exists
        if (!existing.some((e: any) => e.id === payload.id || e.noSppd === payload.noSppd)) {
          existing.push(payload);
          localStorage.setItem('mock_pengajuan', JSON.stringify(existing));
        }
      } catch (e) {}
    } else if (path.startsWith('/pengajuan/') && options.method === 'PUT') {
      try {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        const payload = JSON.parse(options.body as string);
        const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
        const idx = existing.findIndex((e: any) => e.id === id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...payload, updatedAt: new Date().toISOString() };
          localStorage.setItem('mock_pengajuan', JSON.stringify(existing));
        }
      } catch (e) {}
    } else if (path.startsWith('/pengajuan/') && options.method === 'DELETE') {
      try {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        const existing = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
        const newExisting = existing.filter((e: any) => e.id !== id);
        localStorage.setItem('mock_pengajuan', JSON.stringify(newExisting));
      } catch (e) {}
    }

    // Inject local mocks for GET /pengajuan so that data created in offline/demo mode is visible 
    // across different accounts (e.g. from pengelola to kpa) on the same browser.
    if (path.startsWith('/pengajuan') && (!options.method || options.method === 'GET')) {
      const local = JSON.parse(localStorage.getItem('mock_pengajuan') || '[]');
      
      if (Array.isArray(result)) {
        result = { data: result };
      } else if (!result || !result.data) {
        result = { ...result, data: [] };
      } else if (!Array.isArray(result.data)) {
        result.data = [];
      }
      
      if (result && Array.isArray(result.data)) {
        // Gabungkan data dari server dan mock lokal, hindari duplikasi ID
        const serverIds = new Set(result.data.map((d: any) => d.id));
        const newLocals = local.filter((d: any) => !serverIds.has(d.id));
        result.data = [...newLocals, ...result.data];
        result.total = result.data.length;
      }
    }
    
    return result;
  } finally {
    clearTimeout(timer);
  }
}
