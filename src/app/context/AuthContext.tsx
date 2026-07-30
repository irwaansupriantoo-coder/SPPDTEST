import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

export interface UserData {
  nama: string;
  nip: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('-auth-token')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            const metadata = parsed?.user?.user_metadata;
            if (metadata) {
              return {
                nama: metadata.nama || parsed.user?.email?.split('@')[0] || '-',
                nip: metadata.nip || '-',
                role: metadata.role || 'pegawai',
                ...metadata
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Fast auth load failed', e);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata) {
          const metadata = session.user.user_metadata;
          // Fallback if metadata is missing fields
          setUser({
            nama: metadata.nama || session.user.email?.split('@')[0] || '-',
            nip: metadata.nip || '-',
            role: metadata.role || 'pegawai',
            ...metadata
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to get session', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        setUser({
          nama: metadata.nama || session.user.email?.split('@')[0] || '-',
          nip: metadata.nip || '-',
          role: metadata.role || 'pegawai',
          ...metadata
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
