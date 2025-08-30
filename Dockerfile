# Многоэтапная сборка для оптимизации размера образа
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile --production=false

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build

# Production образ
FROM node:22-alpine AS production

WORKDIR /app

# Устанавливаем только production зависимости
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Меняем владельца файлов
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Healthcheck для Yandex Cloud
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/main.js --healthcheck || exit 1

CMD ["node", "dist/main.js"] 