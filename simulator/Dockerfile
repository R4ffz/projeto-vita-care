# syntax=docker/dockerfile:1.6
# ──────────────────────────────────────────────────────────────────────────────
# Simulador IoT do VitaCare — Node.js + mqtt.js + Express.
# Sem build step (JS puro), single-stage. `npm ci` garante install
# determinístico a partir do package-lock.json.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache wget tini

WORKDIR /app
RUN chown node:node /app
USER node

# Deps primeiro pra aproveitar cache de layer quando só o código muda.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node src src

# Porta do servidor HTTP de controle (consumido pelo PainelSimulador).
EXPOSE 4000

# Em container, stdin não é TTY → o CLI é desativado automaticamente
# (lógica em src/index.js); controle fica só via /sim/* HTTP.
ENV NODE_ENV=production \
    CONTROL_PORT=4000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1:4000/sim/status >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--", "node", "src/index.js"]
