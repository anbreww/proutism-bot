# start from node version 7.10
FROM node:alpine

# make a folder for the app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install dependencies
COPY package.json /usr/src/app/
RUN npm install

# bundle the source
COPY . /usr/src/app

# no need to expose any ports
#EXPOSE 8080

# start the server
CMD ["npm", "start"]
