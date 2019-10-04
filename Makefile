.PHONY: check-style clean pre-run test install flow

node_modules: package.json
	@if ! [ $(shell which npm) ]; then \
		echo "npm is not installed"; \
		exit 1; \
	fi

	@echo Getting dependencies using npm

	npm install --ignore-scripts

check-style: | pre-run node_modules
	@echo Checking for style guide compliance

	npm run check

clean:
	@echo Cleaning app

	rm -rf node_modules

pre-run:
	@echo Make sure no previous build are in the folder

	@rm -rf build/*

test: check-style
	npm test


install: node_modules

bundle:
	npm run build
