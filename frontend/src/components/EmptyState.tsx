import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  titulo: string;
  descricao?: string;
  icon?: ComponentType<{ className?: string }>;
  acao?: ReactNode;
}

export function EmptyState({ titulo, descricao, icon: Icon = Inbox, acao }: Props) {
  return (
    <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
      <div className="h-10 w-10 rounded-full bg-vita-bg border border-vita-border
                      inline-flex items-center justify-center text-vita-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-medium text-vita-text">{titulo}</div>
        {descricao && <div className="text-xs text-vita-muted mt-0.5">{descricao}</div>}
      </div>
      {acao && <div>{acao}</div>}
    </div>
  );
}
