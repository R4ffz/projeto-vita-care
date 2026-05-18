import { NavLink } from 'react-router-dom';
import {
  Activity, Users, UserPlus, LineChart, BellRing, SlidersHorizontal, Cpu, X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Logo } from './Logo';

interface ItemNav {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_PRINCIPAL: ItemNav[] = [
  { to: '/central',   label: 'Central',         icon: Activity },
  { to: '/pacientes', label: 'Pacientes',       icon: Users },
  { to: '/alertas',   label: 'Alertas',         icon: BellRing },
];

const NAV_GESTAO: ItemNav[] = [
  { to: '/pacientes/novo', label: 'Cadastrar paciente', icon: UserPlus },
  { to: '/historico',      label: 'Histórico gráfico',  icon: LineChart },
  { to: '/limites',        label: 'Limites clínicos',   icon: SlidersHorizontal },
];

const NAV_SISTEMA: ItemNav[] = [
  { to: '/simulador', label: 'Painel do simulador', icon: Cpu },
];

interface Props {
  /** Em mobile: controlada pelo Layout; em ≥lg sempre visível. */
  aberta: boolean;
  fechar: () => void;
}

export function Sidebar({ aberta, fechar }: Props) {
  return (
    <>
      {/* Backdrop (somente em mobile, quando aberta) */}
      <div
        onClick={fechar}
        aria-hidden
        className={[
          'fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity',
          aberta ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-40',
          'h-full w-64 shrink-0',
          'bg-vita-sidebar text-vita-sidebar-fg',
          'flex flex-col border-r border-black/10',
          'transition-transform duration-200 ease-out',
          aberta ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        aria-label="Navegação principal"
      >
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <Logo variant="sidebar" />
          <button
            onClick={fechar}
            className="lg:hidden text-vita-sidebar-fg hover:text-white p-1.5 -mr-1.5
                       rounded-md hover:bg-vita-sidebar-hover transition"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <Grupo titulo="Monitoramento" itens={NAV_PRINCIPAL} onNavegar={fechar} />
          <Grupo titulo="Gestão"        itens={NAV_GESTAO}    onNavegar={fechar} />
          <Grupo titulo="Sistema"       itens={NAV_SISTEMA}   onNavegar={fechar} />
        </nav>

        <div className="px-5 py-4 border-t border-white/5">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-vita-sidebar-muted">
            Protótipo acadêmico
          </div>
          <div className="text-[11px] text-vita-sidebar-muted mt-0.5">
            PUC Goiás · Internet das Coisas
          </div>
        </div>
      </aside>
    </>
  );
}

function Grupo({
  titulo, itens, onNavegar,
}: { titulo: string; itens: ItemNav[]; onNavegar: () => void }) {
  return (
    <div>
      <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.18em]
                      text-vita-sidebar-muted">
        {titulo}
      </div>
      <ul className="space-y-0.5">
        {itens.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.to === '/central'}
              onClick={onNavegar}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                  isActive
                    ? 'bg-vita-sidebar-active/15 text-white border-l-2 border-vita-sidebar-active -ml-0.5 pl-[10px]'
                    : 'text-vita-sidebar-fg hover:bg-vita-sidebar-hover hover:text-white',
                ].join(' ')
              }
            >
              <it.icon className="h-4 w-4 shrink-0" />
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
