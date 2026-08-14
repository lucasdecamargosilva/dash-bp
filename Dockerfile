# Build do front no proprio deploy (nao depende mais da pasta dist/ commitada)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Servico interno do agente no EasyPanel (projeto_servico:porta).
# Se o servico tiver outro nome, sobrescreva AGENTE_UPSTREAM nas env vars do dashboard.
ENV AGENTE_UPSTREAM=dash-bp_agente:8000

# Template processado pelo entrypoint do nginx (envsubst) na subida do container:
# /api/* e proxy para o agente (com suporte a SSE); todo o resto e o SPA do dash.
RUN printf '%s\n' \
  'server {' \
  '    listen 80;' \
  '    root /usr/share/nginx/html;' \
  '    index index.html;' \
  '    location /api/ {' \
  '        resolver 127.0.0.11 valid=30s;' \
  '        set $agente_up "${AGENTE_UPSTREAM}";' \
  '        proxy_pass http://$agente_up;' \
  '        proxy_http_version 1.1;' \
  '        proxy_set_header Host $host;' \
  '        proxy_set_header Connection "";' \
  '        proxy_buffering off;' \
  '        proxy_cache off;' \
  '        proxy_read_timeout 300s;' \
  '    }' \
  '    location / {' \
  '        try_files $uri $uri/ /index.html;' \
  '    }' \
  '}' \
  > /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
