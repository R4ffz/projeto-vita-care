import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

const TITULOS: Array<{ match: RegExp; titulo: string; subtitulo?: string }> = [
  { match: /^\/central\b/,            titulo: 'Central de monitoramento', subtitulo: 'Visão consolidada de todos os pacientes ativos' },
  { match: /^\/pacientes\/novo\b/,    titulo: 'Cadastro de paciente',     subtitulo: 'Novo paciente monitorado' },
  { match: /^\/pacientes\/\d+\/editar\b/, titulo: 'Editar paciente',      subtitulo: 'Atualizar dados do paciente' },
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

  // Título da aba acompanha a rota.
  useEffect(() => {
    document.title = `${titulo} · VitaCare IoT`;
  }, [titulo]);

  return (
    <div className="min-h-full flex flex-col bg-vita-bg">
      <Topbar titulo={titulo} subtitulo={subtitulo} />
      <main className="flex-1 overflow-y-auto bg-vita-bg relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <Outlet />
        </div>
        {/* Fita ECG animada — fixa no rodapé do main, sensação de monitor vivo */}
        <div aria-hidden
             className="pointer-events-none absolute inset-x-0 bottom-0 h-[90px]
                        vita-ecg-live opacity-60" />
      </main>
      <Footer />
    </div>
  );
}
