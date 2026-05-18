import { useEffect } from 'react';
import { AlertOctagon, Check, X } from 'lucide-react';
import type { Alerta, Paciente } from '@/types';
import { formatarDataHora } from '@/lib/format';

interface Props {
  alerta: Alerta;
  paciente: Paciente;
  onFechar: () => void;
  onAtender: () => void;
  atendendo?: boolean;
}

/**
 * Modal full-screen para alertas críticos de queda. Trava o scroll do body
 * enquanto aberto e fecha com ESC.
 */
export function EmergencyModal({ alerta, paciente, onFechar, onAtender, atendendo }: Props) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-slate-900/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl
                   border-t-4 border-vita-crit overflow-hidden"
      >
        {/* Header com pulso vermelho */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-vita-crit opacity-30 animate-ping" />
            <div className="relative h-12 w-12 rounded-full bg-vita-crit/15
                            text-vita-crit inline-flex items-center justify-center">
              <AlertOctagon className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-vita-crit">
              Alerta crítico
            </div>
            <h2 id="emergency-title" className="mt-1 text-lg font-semibold text-vita-text">
              Queda detectada
            </h2>
            <p className="mt-1 text-sm text-vita-muted">
              {paciente.nome} · {paciente.idade} anos
            </p>
          </div>
          <button
            onClick={onFechar}
            className="vita-btn-ghost -mr-2 -mt-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Detalhes */}
        <div className="px-6 pb-4 space-y-2 text-sm">
          <Linha rotulo="Intensidade" valor={alerta.valorMedido != null ? `${alerta.valorMedido} g` : '—'} />
          <Linha rotulo="Horário"     valor={formatarDataHora(alerta.timestamp)} />
          {paciente.contatoEmergencia && (
            <Linha rotulo="Contato"   valor={paciente.contatoEmergencia} />
          )}
        </div>

        {/* Ações */}
        <div className="px-6 py-4 bg-vita-bg border-t border-vita-border
                        flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button onClick={onFechar} className="vita-btn-secondary">
            Fechar
          </button>
          <button
            onClick={onAtender}
            disabled={atendendo}
            className="inline-flex items-center justify-center gap-2
                       px-4 py-2 rounded-lg text-sm font-medium
                       bg-vita-crit text-white hover:bg-rose-700
                       disabled:opacity-60 disabled:pointer-events-none transition"
          >
            <Check className="h-4 w-4" />
            {atendendo ? 'Registrando…' : 'Marcar como atendido'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1
                    border-b border-vita-border last:border-0">
      <span className="text-xs text-vita-muted">{rotulo}</span>
      <span className="text-sm font-medium text-vita-text font-mono tabular-nums text-right">
        {valor}
      </span>
    </div>
  );
}
