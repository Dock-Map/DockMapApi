FROM node:22-alpine

WORKDIR /app

# Увеличиваем лимит памяти Node.js для сборки
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn install --production=false && yarn build

EXPOSE 3000

CMD ["yarn", "start:prod"] 