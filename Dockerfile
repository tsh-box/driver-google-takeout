FROM node:alpine

ADD package.json package.json
RUN npm install && npm run clean

ADD . .

LABEL databox.type="driver"

EXPOSE 8080

CMD ["npm","start"]
#CMD ["sleep","2147483647"]
