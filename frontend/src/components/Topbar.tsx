import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth, type Perfil } from '@/auth/AuthContext';
import { SimuladorBadge } from './SimuladorBadge';

interface Props {
  titulo: string;
  subtitulo?: string;
}

const ROTULO_PERFIL: Record<Perfil, string> = {
  cuidador:     'Cuidador',
  profissional: 'Profissional',
  admin:        'Administrador',
};

export function Topbar({ titulo, subtitulo }: Props) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 shrink-0 bg-vita-surface border-b border-vita-border
                       px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-vita-text truncate">{titulo}</h1>
        {subtitulo && (
          <p className="text-xs text-vita-muted truncate">{subtitulo}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <SimuladorBadge variant="compact" />

        {usuario && (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5
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
