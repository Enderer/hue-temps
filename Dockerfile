FROM node:10-alpine

RUN apk update && apk add tzdata &&\
    cp /usr/share/zoneinfo/Europe/Prague /etc/localtime &&\
    echo "Europe/Prague" > /etc/timezone &&\
    apk del tzdata && rm -rf /var/cache/apk/*

CMD chown root:root /etc/crontabs/root && /usr/sbin/crond -f

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
RUN npm build
COPY --chown=node:node . .
