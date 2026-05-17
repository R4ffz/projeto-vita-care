import readline from 'node:readline';

const HELP = `
Comandos:
  status                          lista pacientes e estado atual
  queda <id> [intensidade]        publica evento pontual de queda (intensidade default 2.7)
  taquicardia <id>                fixa o paciente em estado de taquicardia
  baixa-saturacao <id>            fixa o paciente em estado de baixa saturacao
  febre <id>                      fixa o paciente em estado de febre
  reset <id>                      volta o paciente ao estado normal
  help                            exibe esta ajuda
  exit | quit                     encerra o simulador (Ctrl+C tambem funciona)
`.trim();

const ESTADOS_POR_COMANDO = {
  taquicardia:        'taquicardia',
  'baixa-saturacao':  'baixa_saturacao',
  febre:              'febre',
};

export function iniciarCli({ pacientes, onQueda, onExit }) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.setPrompt('sim> ');
  console.log(HELP);
  rl.prompt();

  rl.on('SIGINT', () => rl.close());

  rl.on('line', (linha) => {
    const partes = linha.trim().split(/\s+/);
    const cmd = partes[0];

    if (!cmd) {
      rl.prompt();
      return;
    }

    try {
      executar(cmd, partes, pacientes, onQueda, rl);
    } catch (e) {
      console.log(`  erro: ${e.message}`);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    onExit();
  });
}

function executar(cmd, partes, pacientes, onQueda, rl) {
  if (cmd === 'help' || cmd === '?') {
    console.log(HELP);
    return;
  }
  if (cmd === 'exit' || cmd === 'quit') {
    rl.close();
    return;
  }
  if (cmd === 'status') {
    for (const p of pacientes) {
      console.log(`  ${p.id} [${p.perfilKey}] -> ${p.estado}`);
    }
    return;
  }
  if (cmd === 'queda') {
    const p = pacientePor(pacientes, partes[1]);
    if (!p) { console.log('  paciente nao simulado'); return; }
    const intensidade = Number(partes[2]) || 2.7;
    onQueda(p, intensidade);
    console.log(`  queda publicada (paciente ${p.id}, intensidade ${intensidade})`);
    return;
  }
  if (cmd === 'reset') {
    const p = pacientePor(pacientes, partes[1]);
    if (!p) { console.log('  paciente nao simulado'); return; }
    p.reset();
    console.log(`  paciente ${p.id} resetado para normal`);
    return;
  }
  if (ESTADOS_POR_COMANDO[cmd]) {
    const p = pacientePor(pacientes, partes[1]);
    if (!p) { console.log('  paciente nao simulado'); return; }
    p.setEstado(ESTADOS_POR_COMANDO[cmd]);
    console.log(`  paciente ${p.id} -> ${p.estado}`);
    return;
  }
  console.log('  comando desconhecido - digite "help"');
}

function pacientePor(pacientes, idStr) {
  const id = Number(idStr);
  return pacientes.find(p => p.id === id);
}
