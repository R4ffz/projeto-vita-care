import { Loader2 } from 'lucide-react';

interface Props {
  label?: string;
  inline?: boolean;
}

export function LoadingState({ label = 'Carregando…', inline = false }: Props) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-vita-muted">
        <Loader2 className="h-4 w-4 animate-spin text-vita-primary" />
        {label}
      </span>
    );
  }
  return (
    <div className="vita-card px-6 py-10 flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-vita-primary" />
      <span className="text-sm text-vita-muted">{label}</span>
    </div>
  );
}
