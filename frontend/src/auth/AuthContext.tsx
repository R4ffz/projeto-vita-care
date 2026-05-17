// Auth fake/local para esta etapa. Persiste no localStorage.
// O Prompt 16 vai decidir entre manter login fake ou trocar por JWT real.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Perfil = 'cuidador' | 'profissional' | 'admin';

export interface Usuario {
  email: string;
  nome: string;
  perfil: Perfil;
}

interface AuthContextValue {
  usuario: Usuario | null;
  login: (email: string, _senha: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'vitacare:auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setUsuario(JSON.parse(raw) as Usuario); } catch { /* ignora */ }
    }
  }, []);

  const login = (email: string, _senha: string) => {
    const u: Usuario = {
      email,
      nome: nomeAPartirDoEmail(email),
      perfil: inferirPerfil(email),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUsuario(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

function nomeAPartirDoEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function inferirPerfil(email: string): Perfil {
  if (email.startsWith('admin')) return 'admin';
  if (email.startsWith('prof'))  return 'profissional';
  return 'cuidador';
}
