# Build stage
FROM node:20 AS builder
WORKDIR /app

# Увеличиваем память для Node.js для сборки
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Копируем зависимости и устанавливаем
COPY package.json package-lock.json ./
RUN npm ci

# Копируем исходные файлы для сборки
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Сборка приложения
RUN npm run build

# Production stage  
FROM node:20-alpine
WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копируем зависимости и устанавливаем только production
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Экспонируем порт из переменной окружения (Timeweb устанавливает PORT)
EXPOSE ${PORT:-3000}

# Запускаем приложение
CMD ["node", "dist/main.js"] 