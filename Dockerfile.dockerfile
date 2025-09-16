# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the final production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server ./server
RUN cd server && npm install --omit=dev

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/server.js"]