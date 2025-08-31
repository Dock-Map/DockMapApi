# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Production stage  
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"] 