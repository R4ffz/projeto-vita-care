import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ServiceError } from '@/lib/api';

interface Props {
  error: ServiceError;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact = false }: Props) {
  const detalhes = error.fieldErrors
    ? Object.entries(error.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-rose-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{error.message}</span>
      </div>
    );
  }

  return (
    <div className="vita-card border-l-4 border-l-vita-crit px-5 py-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-vita-crit shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-vita-text">
          {error.status ? `Erro ${error.status}` : 'Falha de comunicação'}
        </div>
        <div className="text-sm text-vita-muted mt-0.5">{error.message}</div>
        {detalhes && (
          <div className="text-xs text-vita-muted mt-1 font-mono">{detalhes}</div>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="vita-btn-secondary">
          <RefreshCw className="h-4 w-4" /> Tentar de novo
        </button>
      )}
    </div>
  );
}
