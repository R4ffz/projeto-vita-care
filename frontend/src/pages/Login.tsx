import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertTriangle, HeartPulse } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { ServiceError } from '@/lib/api';

interface LocationState {
  from?: string;
}

interface Credencial {
  email: string;
  senha: string;
  papel: string;
  resumo: string;
}

const CREDENCIAIS: Credencial[] = [
  { email: 'admin@vitacare.local',      senha: 'admin123',         papel: 'Administrador', resumo: 'Acesso total ao sistema'           },
  { email: 'enfermagem@vitacare.local', senha: 'profissional123',  papel: 'Profissional',  resumo: 'Acompanha pacientes e alertas'     },
  { email: 'cuidador@vitacare.local',   senha: 'cuidador123',      papel: 'Cuidador',      resumo: 'Visualiza dados dos pacientes'     },
];

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

  const preencherDemo = (c: Credencial) => {
    setEmail(c.email);
    setSenha(c.senha);
    setErro(null);
  };

  return (
    <div className="min-h-full relative vita-gradient-clinical flex items-center justify-center
                    px-4 sm:px-6 py-10 overflow-hidden">
      {/* Brilho ambiente sálvia atrás do card — dá profundidade clínica */}
      <div aria-hidden
           className="absolute inset-0 pointer-events-none
                      bg-[radial-gradient(ellipse_at_center,rgba(95,200,180,0.10),transparent_60%)]" />

      <div className="relative w-full max-w-[440px] z-10">
        {/* Marca centralizada */}
        <header className="flex flex-col items-center text-center mb-7">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-2.5 mb-4
                          ring-1 ring-white/15">
            <HeartPulse className="h-6 w-6 text-vita-primary" />
          </div>
          <div className="font-serif text-[24px] font-medium tracking-tight text-white leading-none">
            VitaCare
          </div>
          <div className="text-[10.5px] font-medium tracking-[0.2em] text-white/55 uppercase mt-1.5">
            iot health
          </div>
        </header>

        {/* Headline editorial */}
        <div className="text-center mb-7 max-w-md mx-auto">
          <p className="text-[11px] uppercase tracking-[0.26em] text-vita-primary/85 mb-3">
            Monitoramento contínuo
          </p>
          <h1 className="font-serif text-[32px] sm:text-[36px] leading-[1.1] tracking-tight text-white">
            Cuidado contínuo,{' '}
            <span className="italic text-white/85">em casa.</span>
          </h1>
          <p className="mt-4 text-[14px] text-white/65 leading-relaxed">
            Plataforma de telemetria clínica para acompanhamento de sinais vitais
            de idosos em ambiente domiciliar.
          </p>
        </div>

        {/* Card do formulário — superfície translúcida sobre o gradiente */}
        <div className="rounded-2xl border border-white/10 bg-vita-surface/85 backdrop-blur-md
                        shadow-soft px-6 sm:px-7 py-7">
          <form onSubmit={submit} className="space-y-4">
            {erro && (
              <div role="alert"
                   className="flex items-start gap-2 px-3.5 py-3 rounded-xl
                              bg-vita-crit-soft border border-vita-crit/40">
                <AlertTriangle className="h-4 w-4 text-vita-crit shrink-0 mt-0.5" />
                <span className="text-[13px] text-vita-crit font-medium">{erro}</span>
              </div>
            )}

            <div>
              <label className="vita-label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-vita-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="vita-input pl-11"
                  placeholder="seu.email@instituicao.org"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="vita-label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-vita-muted" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="vita-input pl-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="vita-btn-primary w-full mt-2 py-3 text-[15px]" disabled={carregando}>
              {carregando
                ? 'Entrando…'
                : <>Entrar <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          </form>

          {/* Credenciais demo — chips clicáveis */}
          <div className="mt-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-vita-border" />
              <span className="text-[11px] font-medium text-vita-muted tracking-wide">
                Acessos de demonstração
              </span>
              <div className="h-px flex-1 bg-vita-border" />
            </div>
            <div className="space-y-2">
              {CREDENCIAIS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => preencherDemo(c)}
                  className="w-full text-left rounded-xl border border-vita-border-strong bg-vita-bg/40
                             hover:bg-vita-surface-elev hover:border-vita-primary/40
                             focus:outline-none focus:ring-2 focus:ring-vita-primary/30
                             px-3.5 py-2.5 transition group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-vita-text truncate leading-tight">
                        {c.email}
                      </div>
                      <div className="text-[11.5px] text-vita-muted mt-0.5">
                        {c.resumo}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10.5px] font-medium text-vita-primary
                                     bg-vita-primary-soft px-2 py-0.5 rounded-full">
                      {c.papel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-vita-muted mt-3 leading-relaxed text-center">
              Clique em um perfil acima para preencher automaticamente.
            </p>
          </div>
        </div>

        {/* Rodapé sutil */}
        <footer className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-white/55">
          <span className="vita-pulse-dot text-vita-primary scale-90" />
          <span>Ambiente de demonstração — dados via simulador IoT virtual</span>
        </footer>
      </div>
    </div>
  );
}
