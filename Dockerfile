FROM node:22-alpine

WORKDIR /app

RUN apk add --no-libc-dev git

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--host", "lan"]