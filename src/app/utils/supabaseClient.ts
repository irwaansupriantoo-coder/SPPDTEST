import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Use window-level singleton so HMR reloads don't create duplicate instances
declare global { interface Window { __sbClient?: SupabaseClient } }

export function getSupabaseClient(): SupabaseClient {
  if (!window.__sbClient) {
    window.__sbClient = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
  }
  return window.__sbClient;
}
export const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;

  // Abort after 8 seconds so the app never hangs on an unreachable server
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${SERVER_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errMsg = `API Error ${res.status}`;
      try {
        const errText = await res.text();
        // Try to parse as JSON to extract specific error message
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errJson.message || errText;
        } catch {
          errMsg = errText || res.statusText;
        }
      } catch {
        errMsg = res.statusText || `HTTP ${res.status}`;
      }
      throw new Error(errMsg);
    }
    
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
