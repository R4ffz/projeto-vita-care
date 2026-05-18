import express from 'express';

const EVENTOS_DE_ESTADO = {
  taquicardia:        'taquicardia',
  'baixa-saturacao':  'baixa_saturacao',
  febre:              'febre',
};

export function iniciarControlServer({ port, pacientes, onQueda }) {
  const app = express();
  app.use(express.json());

  // CORS simples para o frontend Vite local. Mantém HTTP do simulador acessível
  // mesmo quando o painel é servido em outra porta (5173).
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.options('*', (_req, res) => res.sendStatus(204));

  app.get('/sim/status', (_req, res) => {
    res.json({
      pacientes: pacientes.map(p => ({
        id: p.id,
        perfil: p.perfilKey,
        estado: p.estado,
        publicando: p.publicando,
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
    res.json({ ok: true, paciente: p.id, estado: p.estado, publicando: p.publicando });
  });

  app.post('/sim/:id/pausar', (req, res) => {
    const p = buscar(pacientes, req.params.id);
    if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
    p.pausar();
    res.json({ ok: true, paciente: p.id, estado: p.estado, publicando: p.publicando });
  });

  app.post('/sim/:id/retomar', (req, res) => {
    const p = buscar(pacientes, req.params.id);
    if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
    p.retomar();
    res.json({ ok: true, paciente: p.id, estado: p.estado, publicando: p.publicando });
  });

  for (const [rota, estado] of Object.entries(EVENTOS_DE_ESTADO)) {
    app.post(`/sim/:id/${rota}`, (req, res) => {
      const p = buscar(pacientes, req.params.id);
      if (!p) return res.status(404).json({ erro: 'paciente nao simulado' });
      p.setEstado(estado);
      res.json({ ok: true, paciente: p.id, estado: p.estado, publicando: p.publicando });
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
