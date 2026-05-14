FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
COPY seed-mysql.js ./

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "src/server-mysql.js"]
