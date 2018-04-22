FROM node:9.6.1

ENV REFRESHED_AT 20160922:000000

#RUN apt-get install -y ca-certificates git wget libfreetype6 libfontconfig bzip2 make g++ libssl-dev python
RUN mkdir /srv/tickist
RUN mkdir /srv/tickist/frontend
RUN chown -R node:node /srv/tickist

USER node
RUN mkdir /home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
RUN npm install -g @angular/cli

WORKDIR /srv/tickist/frontend/
COPY . /srv/tickist/frontend/
RUN rm -rf node_modules && npm set progress=false && npm config set depth 0 && npm cache clean --force
## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN npm install

#CMD /bin/bash -c 'npm install'

#RUN npm install npm@5.4.2 -g

#RUN npm install npm@latest -g

# Support for running Chrome headless
#RUN apt-get install -y xvfb
#RUN npm install -g @angular/cli@1.4.5

#RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
#RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
#RUN apt-get update && apt-get install -y google-chrome-stable


#RUN chmod +x /etc/init.d/xvfb
#RUN /etc/init.d/xvfb start

# Install Google Chrome
#RUN /tmp/install_chrome.sh



