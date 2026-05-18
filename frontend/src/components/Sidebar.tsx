import { NavLink } from 'react-router-dom';
import {
  HeartPulse, Users, UserPlus, Activity, BellRing, SlidersHorizontal, RadioTower, X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/auth/AuthContext';
import type { Perfil } from '@/types';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { Sparkline } from './Sparkline';

interface ItemNav {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_CUIDADO: ItemNav[] = [
  { to: '/central',   label: 'Central',   icon: HeartPulse },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/alertas',   label: 'Alertas',   icon: BellRing },
];

const NAV_FERRAMENTAS: ItemNav[] = [
  { to: '/pacientes/novo', label: 'Cadastrar paciente', icon: UserPlus },
  { to: '/historico',      label: 'Histórico clínico',  icon: Activity },
  { to: '/limites',        label: 'Limites clínicos',   icon: SlidersHorizontal },
  { to: '/simulador',      label: 'Dispositivos IoT',   icon: RadioTower },
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
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity',
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
        <div className="px-5 py-5 flex items-center justify-between">
          <Logo />
          <button
            onClick={fechar}
            className="lg:hidden text-vita-muted hover:text-vita-text p-1.5 -mr-1.5
                       rounded-md hover:bg-vita-sidebar-hover transition"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {usuario && (
          <div className="px-5 pb-4">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-vita-sidebar-muted mb-2.5">
              Plantão atual
            </div>
            <div className="flex items-center gap-2.5">
              <Avatar nome={usuario.nome} size="sm" tone="sage" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-vita-text truncate leading-tight">
                  {usuario.nome}
                </div>
                <div className="text-[11px] text-vita-sidebar-muted truncate leading-tight mt-0.5">
                  {ROTULO_PERFIL[usuario.perfil]}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-4">
          <ul className="space-y-0.5">
            {NAV_CUIDADO.map(it => <ItemMenu key={it.to} item={it} onNavegar={fechar} ehCentral={it.to === '/central'} />)}
          </ul>
          <div className="mx-3 h-px bg-vita-border-strong/60" />
          <ul className="space-y-0.5">
            {NAV_FERRAMENTAS.map(it => <ItemMenu key={it.to} item={it} onNavegar={fechar} />)}
          </ul>
        </nav>

        {/* Indicador "Recebendo leituras" — mais vivo, com mini-sparkline neon */}
        <div className="px-5 py-4 border-t border-vita-border">
          <div className="flex items-center gap-2.5">
            <span className="vita-pulse-dot text-vita-ok" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-vita-text/90 leading-tight">
                Recebendo leituras
              </div>
              <div className="text-[10px] text-vita-sidebar-muted leading-tight mt-0.5">
                Telemetria ativa
              </div>
            </div>
            <span className="text-vita-ok shrink-0">
              <Sparkline
                valores={[58, 62, 60, 65, 63, 68, 64, 67, 66, 70]}
                width={42}
                height={16}
                strokeWidth={1.2}
              />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

function ItemMenu({
  item, onNavegar, ehCentral = false,
}: { item: ItemNav; onNavegar: () => void; ehCentral?: boolean }) {
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/central'}
        onClick={onNavegar}
        className={({ isActive }) =>
          [
            'flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition',
            isActive
              ? 'bg-vita-primary text-vita-bg font-medium shadow-glow'
              : 'text-vita-sidebar-fg hover:bg-vita-sidebar-hover hover:text-vita-text',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-vita-bg' : 'text-vita-sidebar-muted'}`} />
            <span className="truncate">{item.label}</span>
            {ehCentral && !isActive && (
              <span aria-hidden className="ml-auto vita-pulse-dot text-vita-ok scale-75" />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}
