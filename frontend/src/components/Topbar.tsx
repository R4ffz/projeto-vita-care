import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import type { Perfil } from '@/types';
import { SimuladorBadge } from './SimuladorBadge';

interface Props {
  titulo: string;
  subtitulo?: string;
  /** Abre o drawer da sidebar em telas <lg. */
  onAbrirMenu: () => void;
}

const ROTULO_PERFIL: Record<Perfil, string> = {
  CUIDADOR:     'Cuidador',
  PROFISSIONAL: 'Profissional',
  ADMIN:        'Administrador',
};

export function Topbar({ titulo, subtitulo, onAbrirMenu }: Props) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 shrink-0 bg-vita-surface border-b border-vita-border
                       px-4 sm:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onAbrirMenu}
          className="lg:hidden -ml-1.5 p-2 rounded-md text-vita-muted
                     hover:text-vita-text hover:bg-vita-bg transition"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-vita-text truncate">{titulo}</h1>
          {subtitulo && (
            <p className="text-xs text-vita-muted truncate hidden sm:block">{subtitulo}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:block">
          <SimuladorBadge variant="compact" />
        </div>

        {usuario && (
          <>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5
                            rounded-full bg-vita-bg border border-vita-border">
              <ShieldCheck className="h-3.5 w-3.5 text-vita-primary" />
              <div className="text-xs">
                <span className="font-medium text-vita-text">{usuario.nome}</span>
                <span className="text-vita-muted"> · {ROTULO_PERFIL[usuario.perfil]}</span>
              </div>
            </div>
            <button onClick={sair} className="vita-btn-ghost" title="Sair">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
