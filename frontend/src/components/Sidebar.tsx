import { NavLink } from 'react-router-dom';
import {
  Activity, Users, UserPlus, LineChart, BellRing, SlidersHorizontal, Cpu, X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/auth/AuthContext';
import type { Perfil } from '@/types';
import { Logo } from './Logo';
import { Avatar } from './Avatar';

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

const ROTULO_PERFIL: Record<Perfil, string> = {
  CUIDADOR:     'Cuidador',
  PROFISSIONAL: 'Profissional',
  ADMIN:        'Administrador',
};

interface Props {
  aberta: boolean;
  fechar: () => void;
}

export function Sidebar({ aberta, fechar }: Props) {
  const { usuario } = useAuth();

  return (
    <>
      <div
        onClick={fechar}
        aria-hidden
        className={[
          'fixed inset-0 z-30 bg-vita-text/40 backdrop-blur-sm lg:hidden transition-opacity',
          aberta ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-40',
          'h-full w-64 shrink-0',
          'bg-vita-sidebar text-vita-sidebar-fg',
          'flex flex-col border-r border-vita-border',
          'transition-transform duration-200 ease-out',
          aberta ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        aria-label="Navegação principal"
      >
        <div className="px-5 py-5 border-b border-vita-border flex items-center justify-between">
          <Logo />
          <button
            onClick={fechar}
            className="lg:hidden text-vita-muted hover:text-vita-text p-1.5 -mr-1.5
                       rounded-md hover:bg-white transition"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cartão do usuário logado — humaniza a sidebar */}
        {usuario && (
          <div className="px-4 py-4 border-b border-vita-border">
            <div className="flex items-center gap-3">
              <Avatar nome={usuario.nome} size="md" tone="sage" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-vita-text truncate">
                  {usuario.nome}
                </div>
                <div className="text-[11px] text-vita-muted truncate">
                  {ROTULO_PERFIL[usuario.perfil]}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <Grupo titulo="Monitoramento" itens={NAV_PRINCIPAL} onNavegar={fechar} />
          <Grupo titulo="Gestão"        itens={NAV_GESTAO}    onNavegar={fechar} />
          <Grupo titulo="Sistema"       itens={NAV_SISTEMA}   onNavegar={fechar} />
        </nav>

        {/* Rodapé neutro — sem refs acadêmicas. */}
        <div className="px-5 py-4 border-t border-vita-border">
          <div className="flex items-center gap-2 text-[11px] text-vita-muted">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-vita-ok opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vita-ok" />
            </span>
            <span>Telemetria ativa</span>
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
      <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em]
                      font-medium text-vita-sidebar-muted/80">
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition relative',
                  isActive
                    ? 'bg-vita-primary-soft text-vita-primary-strong font-medium'
                    : 'text-vita-sidebar-fg hover:bg-white hover:text-vita-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span aria-hidden
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full
                                     bg-vita-primary" />
                  )}
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span>{it.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
