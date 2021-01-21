FROM node:12.20
ENV LANG C.UTF-8

WORKDIR /app
COPY package*.json ./
RUN npm install
ENV PATH /app/node_modules/.bin:$PATH
COPY . /app/bot
WORKDIR /app/bot
CMD ["npm", "start"]
