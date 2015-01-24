#!/bin/bash
set -e

if test "$nolink" = 1;  then
  echo "Starting without a database link"
  export ARANGODB_SERVER=none
else

  # sanity check
  export ARANGODB_SERVER=http://localhost:8529

  if [ -n "$GUESSER_BACK_END_PORT_8529_TCP_ADDR" ];  then
    ARANGODB_SERVER="http://${GUESSER_BACK_END_PORT_8529_TCP_ADDR}:8529"
    ARANGODB_ENDPOINT="$GUESSER_BACK_END_PORT_8529_TCP"
  elif [ -n "$DB_LINK_PORT_8529_TCP_ADDR" ];  then
    ARANGODB_SERVER=http://${DB_LINK_PORT_8529_TCP_ADDR}:8529
    ARANGODB_ENDPOINT="$DB_LINK_PORT_8529_TCP"
  else
    echo "warning: DB_LINK_PORT_8529_TCP_ADDR env variable is not set, please link the ArangoDB with '--link instancename:db-link'"
    env | sort
    exit 1
  fi

  if test "$init" = 1;  then
    echo "Going to initialize the database at $ARANGODB_ENDPOINT"

    foxx-manager --server.endpoint $ARANGODB_ENDPOINT fetch zip /install/guesser-foxx.zip
    foxx-manager --server.endpoint $ARANGODB_ENDPOINT mount guesser /guesser
    foxx-manager --server.endpoint $ARANGODB_ENDPOINT setup /guesser
  fi
fi

# switch into the guesser directory
cd /data/node_modules/guesser

# and start node
NODE_ENV=production node -e 'require("guesser")'
