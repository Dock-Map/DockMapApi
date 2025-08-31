# Build stage
FROM node:20 AS builder
WORKDIR /app

# Увеличиваем память для Node.js и отключаем TypeScript strict проверки для скорости
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=development

# Копируем зависимости и устанавливаем
COPY package.json package-lock.json ./
RUN npm ci

# Копируем только необходимые файлы для сборки
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Быстрая сборка без типов для продакшена
RUN npm run build

# Production stage  
FROM node:20-alpine
WORKDIR /app

# Копируем зависимости
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"] 