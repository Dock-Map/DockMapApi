FROM node:22-alpine

WORKDIR /app

# Увеличиваем лимит памяти Node.js для сборки
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY *.json ./

RUN yarn

COPY . .

RUN yarn build

ARG NODE_ENV=production
# COPY .env.$NODE_ENV .env

EXPOSE 3000

CMD ["sh", "-c", "yarn start:prod"] 