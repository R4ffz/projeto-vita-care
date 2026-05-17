import express from 'express';

const EVENTOS_DE_ESTADO = {
  taquicardia:        'taquicardia',
  'baixa-saturacao':  'baixa_saturacao',
  febre:              'febre',
};

export function iniciarControlServer({ port, pacientes, onQueda }) {
  const app = express();
  app.use(express.json());

  app.get('/sim/status', (_req, res) => {
    res.json({
      pacientes: pacientes.map(p => ({
        id: p.id,
        perfil: p.perfilKey,
        estado: p.estado,
      })),
    });
  });

  app.post('/sim/:id/queda', (req, res) => {
    const p = buscar(pacientes, req.params.id);
    if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
    const intensidade = Number(req.body?.intensidade) || 2.7;
    onQueda(p, intensidade);
    res.json({ ok: true, evento: 'queda', paciente: p.id, intensidade });
  });

  app.post('/sim/:id/reset', (req, res) => {
    const p = buscar(pacientes, req.params.id);
    if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
    p.reset();
    res.json({ ok: true, paciente: p.id, estado: p.estado });
  });

  for (const [rota, estado] of Object.entries(EVENTOS_DE_ESTADO)) {
    app.post(`/sim/:id/${rota}`, (req, res) => {
      const p = buscar(pacientes, req.params.id);
      if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
      p.setEstado(estado);
      res.json({ ok: true, paciente: p.id, estado: p.estado });
    });
  }

  return new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`[control] HTTP em http://localhost:${port}/sim`);
      resolve(server);
    });
  });
}

function buscar(pacientes, idParam) {
  const id = Number(idParam);
  return pacientes.find(p => p.id === id);
}
