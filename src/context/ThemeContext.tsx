import React, { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'light' | 'dark';
interface ThemeCtx { mode: Mode; toggle: () => void }

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export const ThemeProviderWeb: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('mr_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('mr_theme', mode);
  }, [mode]);

  return (
    <Ctx.Provider value={{ mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </Ctx.Provider>
  );
};

export const useThemeWeb = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useThemeWeb must be inside ThemeProviderWeb');
  return c;
};