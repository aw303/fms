FROM node:22-alpine AS base

WORKDIR /app

FROM base AS development

ENV NG_CLI_ANALYTICS=false

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]

FROM base AS build

ENV NG_CLI_ANALYTICS=false

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
