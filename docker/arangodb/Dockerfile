# use base node.js
FROM arangodb/arangodb

# maintainer info
MAINTAINER Frank Celler <f.celler@arangodb.com>

# copy the startup script
ADD ./scripts /scripts

# copy the install files
ADD ./guesser-foxx.zip /install/guesser-foxx.zip

# expose data, apps and logs
VOLUME ["/data", "/apps", "/apps-dev", "/logs"]

# database is running on port 8529
EXPOSE 8529

# start the node server
CMD [ "/scripts/start.sh" ]
