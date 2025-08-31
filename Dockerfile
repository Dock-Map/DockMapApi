FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости для сборки
COPY package.json yarn.lock ./

# Устанавливаем только production зависимости + dev для сборки
RUN yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn build

# Удаляем dev зависимости для уменьшения размера образа
RUN yarn install --production --frozen-lockfile

# Устанавливаем переменную окружения
ENV NODE_ENV=production

EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"] 