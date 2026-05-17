# VitaCare IoT — Frontend

Interface web do VitaCare IoT em **React + Vite + TypeScript**, com Tailwind CSS,
React Router, Axios, `@stomp/stompjs` e Recharts.

> Nesta etapa (Prompt 11), todas as telas usam **dados mockados** (`src/lib/mocks.ts`).
> A integração real com a API REST e o WebSocket STOMP do backend entra no Prompt 12 e 13.
> Os clientes Axios (`src/lib/api.ts`) e STOMP (`src/lib/stomp.ts`) já estão prontos para uso.

---

## Stack

| Camada              | Tecnologia |
|---|---|
| Framework           | React 18 + TypeScript |
| Build / dev server  | Vite 5 |
| Estilização         | Tailwind CSS 3 + tokens semânticos (`vita-*`) |
| Roteamento          | React Router 6 |
| HTTP                | Axios 1.x |
| WebSocket           | `@stomp/stompjs` 7 (nativo, sem SockJS — bate com o `WebSocketConfig` do backend) |
| Gráficos            | Recharts |
| Ícones              | `lucide-react` |
| Tipografia          | Inter (UI) + JetBrains Mono (valores numéricos / rótulos técnicos) |

## Pré-requisitos

- Node.js 20+

## Instalação

```bash
cd frontend
npm install
cp .env.example .env       # opcional — defaults já funcionam
```

## Como rodar

```bash
npm run dev                # http://localhost:5173
npm run build              # produção em dist/
npm run preview            # serve dist/ localmente
npm run typecheck          # tsc sem emitir
```

Saída esperada do `npm run dev`:

```
VITE v5.x  ready in ~600 ms
➜ Local: http://localhost:5173/
```

Como o login é fake nesta etapa, **qualquer e-mail e senha** entram. Prefixos do e-mail
determinam o perfil exibido: `admin@…` → administrador, `prof@…` → profissional,
qualquer outro → cuidador. As credenciais ficam no `localStorage` em `vitacare:auth`.

## Identidade visual

Paleta **Med Tech** (`tailwind.config.ts`, token `vita.*`):

| Token            | Hex      | Uso |
|---|---|---|
| `vita.primary`   | `#0d9488` (teal-600) | Marca, ações primárias, links |
| `vita.accent`    | `#f59e0b` (amber-500) | Acentos discretos |
| `vita.bg`        | `#f8fafc` (slate-50)  | Fundo do app |
| `vita.surface`   | `#ffffff` | Cards, superfícies |
| `vita.sidebar`   | `#0f172a` (slate-900) | Sidebar |
| `vita.ok` / `warn` / `crit` | emerald / amber / rose | Semáforo de status |

**Indicação do simulador** (sem badge "MODO SIMULAÇÃO" gritante):
- Pill discreto no topbar: ícone + texto "IoT virtual" (`SimuladorBadge` variant `compact`)
- Linha no rodapé: "Ambiente de demonstração — dados recebidos via simulador IoT virtual" (variant `full`)
- Bloco contextual no Dashboard do paciente (`Dispositivo: IoT virtual` + tópicos MQTT e canal WS)

## Estrutura

```
frontend/
├── index.html, vite.config.ts, tailwind.config.ts, tsconfig.json, postcss.config.js
├── .env.example                 # VITE_API_URL, VITE_WS_URL, VITE_SIM_URL
├── public/favicon.svg
└── src/
    ├── main.tsx, App.tsx
    ├── routes.tsx               # rotas + ProtectedRoute em volta do Layout
    ├── index.css                # diretivas Tailwind + classes utilitárias .vita-*
    ├── vite-env.d.ts            # tipos do import.meta.env
    ├── types/                   # Paciente, Leitura, Alerta, LimiteConfig…
    ├── lib/
    │   ├── api.ts               # axios singletons (backend e simulator)
    │   ├── stomp.ts             # createStompClient (não instanciado ainda)
    │   ├── format.ts            # helpers (data, hora relativa, rótulos)
    │   └── mocks.ts             # dados sintéticos alinhados ao seed do Flyway
    ├── auth/
    │   ├── AuthContext.tsx      # login fake/local (localStorage)
    │   └── ProtectedRoute.tsx
    ├── components/
    │   ├── Layout.tsx           # Sidebar + Topbar + Outlet + Footer
    │   ├── Sidebar.tsx          # nav agrupada (Monitoramento / Gestão / Sistema)
    │   ├── Topbar.tsx           # título + SimuladorBadge + usuário
    │   ├── Footer.tsx           # créditos + indicação de simulador
    │   ├── SimuladorBadge.tsx   # pill discreto / linha de rodapé
    │   ├── Logo.tsx
    │   ├── Card.tsx             # Card / CardHeader / CardBody / CardTitle
    │   ├── SinalCard.tsx        # card grande de BPM/SpO2/Temp
    │   ├── SeveridadeBadge.tsx
    │   └── StatusDot.tsx        # semáforo verde/amarelo/vermelho
    └── pages/
        ├── Login.tsx
        ├── Central.tsx                 # /central — multi-paciente
        ├── Pacientes.tsx               # /pacientes — lista
        ├── DashboardPaciente.tsx       # /pacientes/:id
        ├── CadastroPaciente.tsx        # /pacientes/novo
        ├── HistoricoGrafico.tsx        # /historico
        ├── ListaAlertas.tsx            # /alertas
        ├── ConfiguracaoLimites.tsx     # /limites
        ├── PainelSimulador.tsx         # /simulador
        └── NotFound.tsx
```

## Rotas

| Rota                 | Tela                          | Auth |
|---|---|---|
| `/login`             | Login                         | público |
| `/central`           | Central de monitoramento      | protegida |
| `/pacientes`         | Lista de pacientes            | protegida |
| `/pacientes/novo`    | Cadastro de paciente          | protegida |
| `/pacientes/:id`     | Dashboard do paciente         | protegida |
| `/historico`         | Histórico gráfico             | protegida |
| `/alertas`           | Lista de alertas              | protegida |
| `/limites`           | Configuração de limites       | protegida |
| `/simulador`         | Painel do simulador           | protegida |

Rotas protegidas redirecionam para `/login` quando não há usuário no `localStorage`.

## Integração com o backend (preparada, não ativada)

O `vite.config.ts` já tem proxy para evitar CORS em dev:

```
/api  →  http://localhost:8080   (REST do backend Spring)
/ws   →  ws://localhost:8080     (WebSocket STOMP, ws:true)
/sim  →  http://localhost:4000   (servidor de controle do simulador)
```

Variáveis em `.env`:
- `VITE_API_URL` — base do Axios para o backend
- `VITE_WS_URL`  — endpoint STOMP nativo
- `VITE_SIM_URL` — controle do simulador

Quando o Prompt 12 começar, os services consumem `api` de `@/lib/api`; o Prompt 13
instancia o `createStompClient()` no Dashboard.

## Limitações conhecidas desta etapa

- Todos os dados vêm de `src/lib/mocks.ts`. Botões de "salvar" exibem `alert(...)` e não persistem nada.
- Cadastro, marcar alerta como atendido, salvar limites e ações do Painel do Simulador são apenas estado local.
- Bundle único de ~600 KB (Recharts é pesado). Code-splitting fica para o Prompt 17.
- Login fake — qualquer credencial entra. Decisão entre manter ou trocar por JWT é do Prompt 16.
