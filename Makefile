.PHONY: check-style clean pre-run test install


.npminstall: package.json
	@if ! [ $(shell command -v npm) ]; then \
		echo "npm is not installed"; \
		exit 1; \
	fi

	@echo Getting dependencies using npm

	npm install --ignore-scripts --no-package-lock

	touch $@

check-style: | pre-run .npminstall
	@echo Checking for style guide compliance

	npm run check


clean:
	@echo Cleaning app

	npm cache clean --force
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

test: check-style
	npm test

install: .npminstall
