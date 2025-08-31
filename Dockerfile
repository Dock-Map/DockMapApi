FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости
RUN apk add --no-cache python3 make g++

# Копируем файлы для установки зависимостей
COPY package.json package-lock.json ./

# Устанавливаем все зависимости для сборки
RUN npm ci

# Копируем исходники
COPY . .

# Собираем приложение
RUN npm run build

# Очищаем dev зависимости после сборки
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main"] 