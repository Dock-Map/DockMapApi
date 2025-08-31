# Этап сборки
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Устанавливаем все зависимости для сборки
RUN yarn install --frozen-lockfile --network-timeout 100000

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build

# Production этап
FROM node:22-alpine AS production

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Устанавливаем только production зависимости
RUN yarn install --production --frozen-lockfile --network-timeout 100000 && yarn cache clean

# Копируем собранное приложение из builder этапа
COPY --from=builder /app/dist ./dist

# Устанавливаем переменную окружения
ENV NODE_ENV=production

EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"] 