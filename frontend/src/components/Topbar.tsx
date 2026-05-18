import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { RelogioVivo } from './RelogioVivo';
import { SimuladorBadge } from './SimuladorBadge';

interface Props {
  titulo: string;
  subtitulo?: string;
  onAbrirMenu: () => void;
}

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
          <h1 className="font-serif text-lg font-medium tracking-tight text-vita-text truncate">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-xs text-vita-muted truncate hidden sm:block">{subtitulo}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <RelogioVivo />
        <div className="hidden sm:block">
          <SimuladorBadge variant="compact" />
        </div>
        {usuario && (
          <button onClick={sair} className="vita-btn-ghost" title="Sair">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
}
