.PHONY: check-style clean pre-run test install flow

.npminstall: package.json
	@if ! [ $(shell which npm) ]; then \
		echo "npm is not installed"; \
		exit 1; \
	fi

	@echo Getting dependencies using npm

	npm install --ignore-scripts

	touch $@

check-style: | pre-run .npminstall
	@echo Checking for style guide compliance

	npm run check

clean:
	@echo Cleaning app

	rm -rf node_modules
	rm -f .npminstall

pre-run:
	@echo Make sure no previous build are in the folder

	@rm -rf actions
	@rm -rf action_types
	@rm -rf client
	@rm -rf constants
	@rm -rf reducers
	@rm -rf selectors
	@rm -rf store
	@rm -rf utils
	@rm -rf lib

test: check-style
	npm test

flow: .flowinstall
	@echo Checking types

	npm run flow

.flowinstall: .npminstall
	@echo Getting flow-typed packages

	npm run flow-typed install

	touch $@

install: .npminstall

bundle:
	npm run build
	npm run webpack
