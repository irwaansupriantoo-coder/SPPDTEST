import { generateUUID } from './uuid';

export interface ActivityUser {
  nama: string;
  nip: string;
  role: string;
}

export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'pengajuan_sppd' 
  | 'status_sppd' 
  | 'pembuatan_spj' 
  | 'status_spj';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user: ActivityUser;
  sppd?: string; // Tautkan ke nomor SPPD jika berkaitan
}

export function logActivity(
  type: ActivityType,
  title: string,
  description?: string,
  sppd?: string,
  customUser?: ActivityUser
) {
  try {
    // Determine user
    let currentUser: ActivityUser | null = null;
    if (customUser) {
      currentUser = customUser;
    } else {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        currentUser = JSON.parse(userJson);
      }
    }

    if (!currentUser) return; // Cannot log without user context

    const logs: ActivityLog[] = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    
    const newLog: ActivityLog = {
      id: generateUUID(),
      type,
      title,
      description,
      sppd,
      timestamp: new Date().toISOString(),
      user: currentUser
    };

    logs.push(newLog);
    
    // Keep only the last 150 logs to prevent localStorage bloat
    localStorage.setItem('activity_logs', JSON.stringify(logs.slice(-150)));
  } catch (e) {
    console.error('Failed to save activity log', e);
  }
}

export function getActivityLogs(): ActivityLog[] {
  try {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    // Sort descending by timestamp
    return logs.sort((a: ActivityLog, b: ActivityLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Failed to get activity logs', e);
    return [];
  }
}
