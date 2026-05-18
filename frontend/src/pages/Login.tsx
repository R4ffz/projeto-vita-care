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
        setErro('Não foi possível entrar agora. Tente novamente em instantes.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-vita-bg vita-ecg-bg">
      <header className="px-6 sm:px-10 py-6 flex items-center">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Cabeçalho editorial — serif italic dá tom humano */}
          <div className="text-center mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-vita-primary mb-3">
              Monitoramento contínuo
            </p>
            <h1 className="vita-display text-3xl sm:text-[34px] leading-tight">
              Cuidado contínuo, <span className="italic text-vita-accent">em casa.</span>
            </h1>
            <p className="mt-3 text-sm text-vita-muted leading-relaxed">
              Plataforma de telemetria clínica para acompanhamento de sinais vitais
              de idosos em ambiente domiciliar.
            </p>
          </div>

          {/* Card de login flutuante */}
          <div className="vita-card shadow-soft px-6 sm:px-8 py-7">
            <form onSubmit={submit} className="space-y-4">
              {erro && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2.5
                                              rounded-lg bg-vita-crit-soft border border-vita-crit/20">
                  <AlertTriangle className="h-4 w-4 text-vita-crit shrink-0 mt-0.5" />
                  <span className="text-xs text-vita-crit font-medium">{erro}</span>
                </div>
              )}

              <div>
                <label className="vita-label">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vita-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vita-input pl-9"
                    placeholder="seu.email@instituicao.org"
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

              <button type="submit" className="vita-btn-primary w-full mt-1" disabled={carregando}>
                {carregando
                  ? 'Entrando…'
                  : <>Entrar <ArrowRight className="h-4 w-4" /></>
                }
              </button>
            </form>

            {/* Credenciais de demonstração — explícitas mas discretas */}
            <div className="mt-6 pt-5 border-t border-vita-border">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-vita-muted mb-2.5">
                Acesso de demonstração
              </div>
              <ul className="space-y-1 text-[11px] font-mono text-vita-text/80">
                <li className="flex justify-between gap-3">
                  <span>admin@vitacare.local</span>
                  <span className="text-vita-muted">admin123</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>enfermagem@vitacare.local</span>
                  <span className="text-vita-muted">profissional123</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>cuidador@vitacare.local</span>
                  <span className="text-vita-muted">cuidador123</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé sutil com indicação do simulador */}
      <footer className="px-6 sm:px-10 py-5 border-t border-vita-border bg-vita-surface/60
                         flex items-center justify-center">
        <SimuladorBadge variant="full" />
      </footer>
    </div>
  );
}
