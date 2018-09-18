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

	@rm -rf actions
	@rm -rf action_types
	@rm -rf client
	@rm -rf constants
	@rm -rf reducers
	@rm -rf selectors
	@rm -rf store
	@rm -rf utils
	@rm -rf lib

test: check-style flow
	npm test

flow: .flowinstall
	@echo Checking types

	npm run flow

.flowinstall: node_modules
	@echo Getting flow-typed packages

	npm run flow-typed install

	touch $@

install: node_modules

bundle:
	npm run build
	npm run webpack
