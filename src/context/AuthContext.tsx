import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  admin: { id: 'usr-1', name: 'Admin Pusat', role: 'admin' },
  gudang_eltari: { id: 'usr-2', name: 'Gudang El Tari', role: 'gudang_pengirim', branch_id: 'CB001', branch_name: 'Toko Nasional Kitchen Eltari' },
  gudang_kefa: { id: 'usr-3', name: 'Gudang Kefa', role: 'gudang_penerima', branch_id: 'CB004', branch_name: 'Toko Perabot Mama Kefamenanu' },
  sopir: { id: 'usr-4', name: 'Pak Budi (Sopir)', role: 'sopir' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gh_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.admin;
  });

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('gh_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gh_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
