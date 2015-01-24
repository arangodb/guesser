#!/bin/bash
set -e

# add arangodb source
ARANGO_URL=https://www.arangodb.com/repositories/arangodb2/xUbuntu_14.04

# non interactive
echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# update system
echo " ---> Updating the system"
apt-get -y -qq --force-yes update
apt-get -y -qq install wget
apt-get -y -qq install dnsutils
apt-get -y -qq install apt-transport-https

# install arangodb key
echo " ---> Adding ArangoDB repository"
echo "deb $ARANGO_URL/ /" >> /etc/apt/sources.list.d/arangodb.list
wget --quiet $ARANGO_URL/Release.key
apt-key add - < Release.key
rm Release.key
apt-get -y -qq --force-yes update

# use NPM to install the guesser game
echo " ---> Installing the guesser game"
mkdir /data/node_modules
cp -a /install/guesser-node /data/node_modules/guesser
(cd /tmp && npm install -g bower)
(cd /data/node_modules/guesser && npm install --unsafe-perm)

# install arangodb
echo " ---> Installing arangodb-client package"
cd /tmp
apt-get -y -qq --force-yes install arangodb-client

# cleanup
echo " ---> Cleaning up"
apt-get -y -qq --force-yes clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
