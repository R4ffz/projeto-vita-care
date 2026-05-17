import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

const TITULOS: Array<{ match: RegExp; titulo: string; subtitulo?: string }> = [
  { match: /^\/central\b/,            titulo: 'Central de monitoramento', subtitulo: 'Visão consolidada de todos os pacientes ativos' },
  { match: /^\/pacientes\/novo\b/,    titulo: 'Cadastro de paciente',     subtitulo: 'Novo paciente monitorado' },
  { match: /^\/pacientes\/\d+\b/,     titulo: 'Dashboard do paciente',    subtitulo: 'Sinais vitais em tempo real e alertas recentes' },
  { match: /^\/pacientes\b/,          titulo: 'Pacientes',                subtitulo: 'Lista de pacientes monitorados' },
  { match: /^\/alertas\b/,            titulo: 'Alertas',                  subtitulo: 'Eventos clínicos gerados pelo sistema' },
  { match: /^\/historico\b/,          titulo: 'Histórico gráfico',        subtitulo: 'Tendências de sinais vitais por paciente' },
  { match: /^\/limites\b/,            titulo: 'Configuração de limites',  subtitulo: 'Faixas clínicas que disparam alertas' },
  { match: /^\/simulador\b/,          titulo: 'Painel do simulador',      subtitulo: 'Controle dos dispositivos IoT virtuais' },
];

export function Layout() {
  const { pathname } = useLocation();
  const item = TITULOS.find(t => t.match.test(pathname));
  const titulo = item?.titulo ?? 'VitaCare IoT';
  const subtitulo = item?.subtitulo;

  return (
    <div className="h-full flex bg-vita-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar titulo={titulo} subtitulo={subtitulo} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
