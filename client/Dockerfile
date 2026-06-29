# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared ./shared
COPY server/package.json ./server/package.json
COPY client ./client

RUN npm install --workspace=shared --workspace=client
RUN npm run build --workspace=client

FROM nginx:alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
