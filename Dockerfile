# Используем официальный Node.js образ (базовый Debian)
FROM node:20

# Рабочая директория приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Удаляем dev зависимости
RUN npm prune --production

# Открываем порт
EXPOSE 3000

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Запуск приложения
CMD ["node", "dist/main.js"] 