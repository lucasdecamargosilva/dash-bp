FROM node:20 AS build

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json .npmrc ./
RUN npm install --legacy-peer-deps

COPY index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json tsconfig.app.json tsconfig.node.json components.json eslint.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
