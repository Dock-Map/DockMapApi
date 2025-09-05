# Этап сборки
FROM node:22-alpine AS builder

WORKDIR /app

# Увеличиваем лимит памяти Node.js для сборки
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build:prod

# Продакшн этап
FROM node:22-alpine AS production

WORKDIR /app

# Устанавливаем только продакшн зависимости
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Копируем собранное приложение из этапа сборки
COPY --from=builder /app/dist ./dist

ARG NODE_ENV=production
# COPY .env.$NODE_ENV .env

EXPOSE 3000

CMD ["sh", "-c", "yarn start:prod"] 