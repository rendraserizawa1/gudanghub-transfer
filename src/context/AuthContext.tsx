import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

function userFromSession(sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const meta = (sessionUser.user_metadata || {}) as Record<string, unknown>;
  const branchId = (meta.branch_id as string) || undefined;
  return {
    id: sessionUser.id,
    name: (meta.name as string) || sessionUser.email || 'User',
    role: (meta.role as User['role']) || 'penerima',
    branch_id: branchId,
    branch_name: branchId ? getBranchName(branchId) : undefined,
    email: sessionUser.email,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthError('Konfigurasi Supabase tidak tersedia.');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(userFromSession(data.session.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(userFromSession(session.user));
      else {
        setUser(null);
        setAuthError(null);
      }
    });

    return () => sub.subscription.unsubscribe();
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