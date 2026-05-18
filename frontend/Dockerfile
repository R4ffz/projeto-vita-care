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
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
