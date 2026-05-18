// Autenticação real via Spring Security + JWT (Prompt 16).
// O token e os dados do usuário ficam no localStorage; o interceptor do Axios
// (em src/lib/api.ts) injeta Authorization automaticamente e dispara o evento
// `vitacare:unauthorized` quando o backend responde 401 em rota protegida.

import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_STORAGE_KEY, ServiceError, UNAUTHORIZED_EVENT } from '@/lib/api';
import { authService } from '@/services';
import type { Perfil, UsuarioLogado } from '@/types';

interface PayloadPersistido {
  token: string;
  usuario: UsuarioLogado;
}

interface AuthContextValue {
  usuario: UsuarioLogado | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<PayloadPersistido | null>(null);
  const navigate = useNavigate();

  // Restaura sessão persistida na carga.
  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    try {
      setEstado(JSON.parse(raw) as PayloadPersistido);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setEstado(null);
  }, []);

  // Reage ao 401 disparado pelo interceptor: limpa estado e redireciona.
  useEffect(() => {
    const handler = () => {
      setEstado(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [navigate]);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      const resp = await authService.login(email.trim(), senha);
      const payload: PayloadPersistido = { token: resp.token, usuario: resp.usuario };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      setEstado(payload);
    } catch (e) {
      // Mantém o erro original (ServiceError) para a tela de Login formatar.
      if (e instanceof ServiceError) throw e;
      throw e;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario: estado?.usuario ?? null,
        token: estado?.token ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

export type { Perfil, UsuarioLogado };
