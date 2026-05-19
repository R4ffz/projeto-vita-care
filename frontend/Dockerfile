# syntax=docker/dockerfile:1.6
# ──────────────────────────────────────────────────────────────────────────────
# Estágio 1 — build do bundle Vite.
# VITE_API_URL é injetado em build-time como "" (string vazia) para que o
# Axios use rota relativa e as chamadas /api/* sejam absorvidas pelo proxy
# do Nginx no estágio 2.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Em produção (Docker), o frontend e o backend são servidos no mesmo host
# (porta 3000 via nginx), então URL relativa funciona perfeitamente.
ENV VITE_API_URL=""

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Estágio 2 — Nginx servindo a SPA + reverse proxy para /api e /ws.
# Usa o suporte de templates da imagem oficial do nginx:
#   /etc/nginx/templates/*.conf.template  →  /etc/nginx/conf.d/*.conf
# Variáveis filtradas (BACKEND_HOST, NGINX_PORT) são substituídas em runtime;
# as nativas do nginx ($host, $remote_addr, ...) permanecem intactas.
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Defaults seguros para `docker-compose up` local (hostname da rede compose).
# Em Railway, sobrescreva BACKEND_HOST=backend.railway.internal:8080.
ENV BACKEND_HOST=backend:8080 \
    NGINX_PORT=80 \
    NGINX_ENVSUBST_FILTER_VARIABLES="BACKEND_HOST NGINX_PORT"

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
