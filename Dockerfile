FROM node:9.6.1

ENV REFRESHED_AT 20160922:000000

#RUN apt-get install -y ca-certificates git wget libfreetype6 libfontconfig bzip2 make g++ libssl-dev python
RUN mkdir /srv/tickist
RUN mkdir /srv/tickist/frontend

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable
RUN apt-get install -yq vim

WORKDIR /srv/tickist/frontend/
COPY . /srv/tickist/frontend/

RUN rm -rf node_modules && npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm i npm@4 -g 
RUN npm install
RUN npm install -g @angular/cli@latest



