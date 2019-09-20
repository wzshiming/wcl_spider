FROM node

WORKDIR /tmp/
COPY . .
RUN npm i
RUN npm run build
RUN rm -rf src *.sh

CMD [ "npm", "start" ]
