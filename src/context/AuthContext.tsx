import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, fetchProfile } from '../lib/supabase';
import { getBranchName } from '../lib/config';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const hydrateUser = async (authUserId: string) => {
    const profile = await fetchProfile(authUserId);
    if (!profile) {
      setUser(null);
      setAuthError('Akun belum memiliki profil. Hubungi superadmin.');
      return;
    }
    setUser({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      branch_id: profile.branch_id || undefined,
      branch_name: profile.branch_id ? getBranchName(profile.branch_id) : undefined,
    });
    setAuthError(null);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthError('Konfigurasi Supabase tidak tersedia.');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void hydrateUser(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void hydrateUser(session.user.id);
      else {
        setUser(null);
        setAuthError(null);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    if (!supabase) {
      setAuthError('Konfigurasi Supabase tidak tersedia.');
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('Email atau password salah.');
      return false;
    }
    return true;
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};