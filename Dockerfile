FROM node:0.10

MAINTAINER Christopher Brown <io@henrian.com>

COPY . /app
WORKDIR /app

RUN npm install

EXPOSE 80

CMD ["npm", "start"]
