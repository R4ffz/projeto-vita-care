import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="vita-card px-6 py-10 text-center max-w-md mx-auto">
      <div className="text-5xl font-mono font-semibold text-vita-primary">404</div>
      <h2 className="mt-3 text-base font-semibold text-vita-text">
        Rota não encontrada
      </h2>
      <p className="mt-1 text-sm text-vita-muted">
        O endereço acessado não existe na plataforma.
      </p>
      <Link to="/central" className="vita-btn-primary mt-5">
        <Home className="h-4 w-4" /> Voltar para a Central
      </Link>
    </div>
  );
}
