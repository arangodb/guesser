#!/bin/bash
set -e

if test "$nolink" = 1;  then
  echo "Starting without a database link"
  export ARANGODB_SERVER=none
else
  if [ -n "$GUESSER_BACK_END_PORT_8529_TCP_ADDR" ];  then
    ARANGODB_SERVER="http://${GUESSER_BACK_END_PORT_8529_TCP_ADDR}:8529"
    ARANGODB_ENDPOINT="$GUESSER_BACK_END_PORT_8529_TCP"
  elif [ -n "$DB_LINK_PORT_8529_TCP_ADDR" ];  then
    ARANGODB_SERVER=http://${DB_LINK_PORT_8529_TCP_ADDR}:8529
    ARANGODB_ENDPOINT="$DB_LINK_PORT_8529_TCP"
  elif [ -n "$MARATHON_APP_ID" ];  then
    ARANGODB_SERVER=http://${HOST}:32222
    ARANGODB_ENDPOINT=tcp://${HOST}:32222
  elif [ -z "$ARANGODB_SERVER" ] || [ -z "$ARANGODB_ENDPOINT" ]; then
    # sanity check
    export ARANGODB_SERVER=http://localhost:8529
    export ARANGODB_ENDPOINT=tcp://localhost:8529

    echo "warning: DB_LINK_PORT_8529_TCP_ADDR env variable is not set, please link the ArangoDB with '--link instancename:db-link'"
    env | sort
    exit 1
  fi

  wget ${ARANGODB_SERVER}/_api/version -q -O -
  while test "$?" -ne 0;  do
    echo
    echo "waiting for database to become ready at $ARANGODB_SERVER"
    sleep 10
    wget ${ARANGODB_SERVER}/_api/version -q -O -
  done
  echo

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
