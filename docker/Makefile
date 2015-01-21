setup:
	@echo "Creating FOXX application file"
	rm -f guesser-foxx.zip
	cd .. && zip docker/guesser-foxx.zip guesser.js manifest.json scripts/setup.js scripts/teardown.js README.md LICENSE

	@echo "Creating NODE application file"
	rm -f guesser-node.tar
	cd ../iojs && tar cvf ../docker/guesser-node.tar guesser_server.js package.json README.md static 
