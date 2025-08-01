FROM node:22-alpine

WORKDIR /app

COPY *.json ./

RUN pnpm i

COPY . .

RUN pnpm build

ARG NODE_ENV=development
#COPY .env.$NODE_ENV .env

EXPOSE 3000

# CMD ["sh", "-c", "pnpm migration:run && pnpm start:prod"]   это уже на прод будет 
CMD ["sh", "-c", "pnpm start:prod"] 