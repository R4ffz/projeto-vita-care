import { NavLink } from 'react-router-dom';
import {
  Activity, Users, UserPlus, LineChart, BellRing, SlidersHorizontal, Cpu,
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

export function Sidebar() {
  return (
    <aside className="h-full w-64 shrink-0 bg-vita-sidebar text-vita-sidebar-fg
                      flex flex-col border-r border-black/10">
      <div className="px-5 py-5 border-b border-white/5">
        <Logo variant="sidebar" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <Grupo titulo="Monitoramento" itens={NAV_PRINCIPAL} />
        <Grupo titulo="Gestão"        itens={NAV_GESTAO} />
        <Grupo titulo="Sistema"       itens={NAV_SISTEMA} />
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
  );
}

function Grupo({ titulo, itens }: { titulo: string; itens: ItemNav[] }) {
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
