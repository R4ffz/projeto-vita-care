import { useState, type ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HeartPulse, Users, UserPlus, Activity, BellRing, SlidersHorizontal,
  RadioTower, Menu, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { temPermissao, type Acao } from '@/auth/permissoes';
import type { Perfil } from '@/types';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { Sparkline } from './Sparkline';
import { RelogioVivo } from './RelogioVivo';
import { SimuladorBadge } from './SimuladorBadge';

interface ItemNav {
  to: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
  /** Se informado, item só aparece para perfis com esta permissão. */
  exigeAcao?: Acao;
}

const NAV_ITENS: ItemNav[] = [
  { to: '/central',        label: 'Central',          icon: HeartPulse },
  { to: '/pacientes',      label: 'Pacientes',        icon: Users },
  { to: '/alertas',        label: 'Alertas',          icon: BellRing },
  { to: '/pacientes/novo', label: 'Cadastrar',        icon: UserPlus,           exigeAcao: 'paciente.criar' },
  { to: '/historico',      label: 'Histórico',        icon: Activity },
  { to: '/limites',        label: 'Limites',          icon: SlidersHorizontal,  exigeAcao: 'limites.configurar' },
  { to: '/simulador',      label: 'Dispositivos IoT', shortLabel: 'IoT', icon: RadioTower, exigeAcao: 'simulador.operar' },
];

const ROTULO_PERFIL: Record<Perfil, string> = {
  CUIDADOR:     'Cuidador',
  PROFISSIONAL: 'Profissional',
  ADMIN:        'Administrador',
};

interface Props {
  titulo: string;
  subtitulo?: string;
}

export function Topbar({ titulo, subtitulo }: Props) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuMobile, setMenuMobile] = useState(false);

  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const itensVisiveis = NAV_ITENS.filter(
    item => !item.exigeAcao || temPermissao(usuario, item.exigeAcao),
  );

  return (
    <header className="sticky top-0 z-20 border-b border-vita-border
                       bg-vita-sidebar/92 backdrop-blur-md">
      {/* ─── Linha principal: Logo + Nav + Ações ────────────────────────── */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-[64px]
                      flex items-center gap-3 sm:gap-5">
        <Logo />

        <div aria-hidden className="hidden lg:block h-7 w-px bg-vita-border-strong/60" />

        {/* Nav horizontal — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0">
          {itensVisiveis.map(item => <ItemNavTop key={item.to} item={item} />)}
        </nav>

        <div className="flex-1 lg:flex-none" />

        {/* Indicador de telemetria — apenas em telas largas */}
        <span className="hidden xl:inline-flex items-center gap-2 px-2.5 py-1 rounded-full
                         border border-vita-border-strong bg-vita-surface/40
                         text-[11.5px] text-vita-muted">
          <span className="vita-pulse-dot text-vita-ok" />
          <span>Recebendo</span>
          <span className="text-vita-ok">
            <Sparkline valores={[58,62,60,65,63,68,64,67,66,70]}
                       width={36} height={12} strokeWidth={1.2} />
          </span>
        </span>

        <RelogioVivo />

        <div className="hidden md:block">
          <SimuladorBadge variant="compact" />
        </div>

        {/* Pílula de usuário */}
        {usuario && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3
                          border-l border-vita-border-strong/60 ml-1">
            <Avatar nome={usuario.nome} size="sm" tone="sage" />
            <div className="hidden sm:block min-w-0 max-w-[140px]">
              <div className="text-[12.5px] font-medium text-vita-text truncate leading-tight">
                {usuario.nome}
              </div>
              <div className="text-[10.5px] text-vita-muted truncate leading-tight mt-0.5">
                {ROTULO_PERFIL[usuario.perfil]}
              </div>
            </div>
            <button onClick={sair}
                    title="Sair"
                    aria-label="Sair"
                    className="ml-0.5 p-2 rounded-md text-vita-muted
                               hover:text-vita-text hover:bg-vita-surface-elev transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Trigger do menu mobile */}
        <button
          onClick={() => setMenuMobile(!menuMobile)}
          className="lg:hidden -mr-1 p-2 rounded-md text-vita-muted
                     hover:text-vita-text hover:bg-vita-surface-elev transition"
          aria-label={menuMobile ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ─── Linha do título da página ──────────────────────────────────── */}
      <div className="border-t border-vita-border/50 bg-vita-bg/40">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex items-baseline gap-3">
          <h1 className="font-serif text-[19px] font-medium tracking-tight
                         text-vita-text leading-tight">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-[12.5px] text-vita-muted truncate hidden sm:block">
              {subtitulo}
            </p>
          )}
        </div>
      </div>

      {/* ─── Drawer mobile ──────────────────────────────────────────────── */}
      {menuMobile && (
        <div className="lg:hidden border-t border-vita-border/60
                        bg-vita-sidebar/97 backdrop-blur-md">
          <nav className="px-4 py-3 space-y-1 max-w-[1500px] mx-auto">
            {itensVisiveis.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/central'}
                onClick={() => setMenuMobile(false)}
                className={({ isActive }) =>
                  ['flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition',
                   isActive
                     ? 'bg-vita-primary text-vita-bg font-medium'
                     : 'text-vita-sidebar-fg hover:bg-vita-surface-elev hover:text-vita-text',
                  ].join(' ')
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function ItemNavTop({ item }: { item: ItemNav }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/central'}
      className={({ isActive }) =>
        ['flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13.5px] transition shrink-0',
         isActive
           ? 'bg-vita-primary text-vita-bg font-semibold shadow-glow'
           : 'text-vita-sidebar-fg hover:bg-vita-surface-elev hover:text-vita-text',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`h-[16px] w-[16px] shrink-0 ${isActive ? 'text-vita-bg' : 'text-vita-sidebar-muted'}`} />
          <span className="hidden xl:inline">{item.label}</span>
          <span className="xl:hidden">{item.shortLabel ?? item.label}</span>
        </>
      )}
    </NavLink>
  );
}
