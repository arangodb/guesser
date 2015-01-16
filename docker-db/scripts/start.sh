#!/bin/bash
set -e

# fireup the database
echo "--> starting ArangoDB"
/usr/sbin/arangod \
	--uid arangodb \
	--gid arangodb \
	--database.directory /data \
	--javascript.app-path /apps \
	--log.file /logs/arangodb.log \
	--temp-path /tmp/arangodb \
	$D1 $D2 \
	"$@" &

# wait a while until it is available
echo "--> waiting for ArangoDB to become ready"
sleep 30

# and install the foxx
if foxx-manager list | fgrep guesser;  then
  echo "--> guesser game is already installed"
else
  echo "--> installing guesser game"

  foxx-manager fetch zip /install/guesser-foxx.zip
  foxx-manager mount guesser /guesser
  foxx-manager setup /guesser
fi

echo "--> ready for business"
wait
