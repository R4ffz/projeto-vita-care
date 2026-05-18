import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { ServiceError } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { SimuladorBadge } from '@/components/SimuladorBadge';

interface LocationState {
  from?: string;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@vitacare.local');
  const [senha, setSenha] = useState('admin123');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      await login(email, senha);
      const destino = (location.state as LocationState | null)?.from ?? '/central';
      navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ServiceError) {
        setErro(err.status === 401 ? 'E-mail ou senha incorretos.' : err.message);
      } else {
        setErro('Falha inesperada ao entrar.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="h-full grid lg:grid-cols-[5fr_4fr]">
      {/* Lado esquerdo: marca + narrativa */}
      <aside className="hidden lg:flex relative flex-col justify-between
                        bg-gradient-to-br from-vita-sidebar via-[#0b3b3d] to-[#0f766e]
                        text-white p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
             style={{
               backgroundImage:
                 'radial-gradient(circle at 20% 30%, #5eead4 0, transparent 40%),' +
                 'radial-gradient(circle at 80% 70%, #f59e0b 0, transparent 35%)',
             }} />

        <Logo variant="sidebar" size={36} />

        <div className="relative z-10 max-w-md">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-vita-primary-soft mb-4">
            Monitoramento contínuo
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Sinais vitais em tempo real, com a tranquilidade de quem cuida em casa.
          </h2>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            Plataforma de telemetria clínica para idosos em ambiente domiciliar.
            Coleta, processa e visualiza dados fisiológicos via arquitetura IoT,
            com alertas automáticos para a equipe de cuidado.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          <div className="font-mono uppercase tracking-[0.2em] mb-1">Trabalho acadêmico</div>
          <div>Pontifícia Universidade Católica de Goiás · 2026</div>
        </div>
      </aside>

      {/* Lado direito: formulário */}
      <main className="flex flex-col bg-vita-bg">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <Logo variant="inline" size={36} />
            </div>

            <h1 className="text-2xl font-semibold text-vita-text">Entrar na plataforma</h1>
            <p className="mt-1 text-sm text-vita-muted">
              Acesse o painel de monitoramento e os controles clínicos.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {erro && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2.5
                                              rounded-lg bg-rose-50 border border-rose-200">
                  <AlertTriangle className="h-4 w-4 text-vita-crit shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-800">{erro}</span>
                </div>
              )}

              <div>
                <label className="vita-label">E-mail corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vita-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vita-input pl-9"
                    placeholder="seu.nome@instituicao.org"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="vita-label">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vita-muted" />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="vita-input pl-9"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="submit" className="vita-btn-primary w-full" disabled={carregando}>
                {carregando ? 'Entrando…' : (<>Entrar <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>

            <div className="mt-6 px-4 py-3 rounded-lg bg-white border border-vita-border">
              <div className="text-[11px] font-mono uppercase tracking-wider text-vita-muted mb-2">
                Credenciais de demonstração
              </div>
              <ul className="text-[11px] text-vita-text space-y-1 font-mono">
                <li>admin@vitacare.local · admin123 <span className="text-vita-muted">(ADMIN)</span></li>
                <li>enfermagem@vitacare.local · profissional123 <span className="text-vita-muted">(PROFISSIONAL)</span></li>
                <li>cuidador@vitacare.local · cuidador123 <span className="text-vita-muted">(CUIDADOR)</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-vita-border bg-vita-surface
                        flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <SimuladorBadge variant="full" />
          <div className="text-[11px] text-vita-muted font-mono tracking-wide">
            VitaCare IoT · v0.1
          </div>
        </div>
      </main>
    </div>
  );
}
