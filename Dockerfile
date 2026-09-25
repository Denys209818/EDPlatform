FROM node:24-slim

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]