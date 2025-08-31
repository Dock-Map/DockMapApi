# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости для сборки
RUN apk add --no-cache python3 make g++ && ln -sf python3 /usr/bin/python

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci --only=production=false

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Удаляем dev зависимости для уменьшения размера образа
RUN npm prune --production && npm cache clean --force

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Меняем владельца файлов
RUN chown -R nestjs:nodejs /app
USER nestjs

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Проверка здоровья (закомментировано для упрощения деплоя)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node healthcheck.js

# Запускаем приложение
CMD ["node", "dist/main.js"] 