import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Central } from '@/pages/Central';
import { Pacientes } from '@/pages/Pacientes';
import { DashboardPaciente } from '@/pages/DashboardPaciente';
import { CadastroPaciente } from '@/pages/CadastroPaciente';
import { EdicaoPaciente } from '@/pages/EdicaoPaciente';
import { HistoricoGrafico } from '@/pages/HistoricoGrafico';
import { ListaAlertas } from '@/pages/ListaAlertas';
import { ConfiguracaoLimites } from '@/pages/ConfiguracaoLimites';
import { PainelSimulador } from '@/pages/PainelSimulador';
import { NotFound } from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/"                   element={<Navigate to="/central" replace />} />

        {/* Acessíveis a qualquer perfil autenticado */}
        <Route path="/central"            element={<Central />} />
        <Route path="/pacientes"          element={<Pacientes />} />
        <Route path="/pacientes/:id"      element={<DashboardPaciente />} />
        <Route path="/historico"          element={<HistoricoGrafico />} />
        <Route path="/alertas"            element={<ListaAlertas />} />

        {/* Restritas: admin + profissional */}
        <Route
          path="/pacientes/novo"
          element={
            <ProtectedRoute exigeAcao="paciente.criar">
              <CadastroPaciente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id/editar"
          element={
            <ProtectedRoute exigeAcao="paciente.editar">
              <EdicaoPaciente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/limites"
          element={
            <ProtectedRoute exigeAcao="limites.configurar">
              <ConfiguracaoLimites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulador"
          element={
            <ProtectedRoute exigeAcao="simulador.operar">
              <PainelSimulador />
            </ProtectedRoute>
          }
        />

        <Route path="*"                   element={<NotFound />} />
      </Route>
    </Routes>
  );
}
