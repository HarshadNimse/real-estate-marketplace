FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY backend ./backend

EXPOSE 5000

CMD ["node", "server.js"]
