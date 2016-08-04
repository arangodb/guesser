# use base node.js
FROM node:argon

# maintainer info
MAINTAINER Frank Celler <f.celler@arangodb.com>

# copy the startup script
ADD ./scripts /scripts

# copy the install files
ADD ./guesser-foxx.zip /install/guesser-foxx.zip
ADD ./guesser-node.tar /install/guesser-node

# install ubuntu package for arangosh
RUN /scripts/install.sh

# application is running on port 8000
EXPOSE 8000

# start the node server
CMD [ "/scripts/start.sh" ]
