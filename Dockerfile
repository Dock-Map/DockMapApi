# Этап сборки
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем все зависимости для сборки
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production этап
FROM node:22-alpine AS production

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev && npm cache clean --force

# Копируем собранное приложение из builder этапа
COPY --from=builder /app/dist ./dist

# Устанавливаем переменную окружения
ENV NODE_ENV=production

EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"] 