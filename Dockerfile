FROM node:fermium-alpine

WORKDIR /home/media-scraper

# add chromium
RUN apk add --no-cache  chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.10/main

COPY package.json .
RUN npm install

COPY . .

EXPOSE 2222

ENTRYPOINT ["node","server.js"]