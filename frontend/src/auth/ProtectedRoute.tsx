import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { temPermissao, type Acao } from './permissoes';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Se informada, exige que o usuário tenha permissão para essa ação. */
  exigeAcao?: Acao;
}

export function ProtectedRoute({ children, exigeAcao }: Props) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Sem permissão para esta ação → manda para a Central (rota acessível a todos).
  if (exigeAcao && !temPermissao(usuario, exigeAcao)) {
    return <Navigate to="/central" replace />;
  }

  return <>{children}</>;
}
