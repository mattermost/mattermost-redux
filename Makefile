.PHONY: check-style clean pre-run test install


.yarninstall: package.json
	@if ! [ $(shell which yarn) ]; then \
		echo "yarn is not installed"; \
		exit 1; \
	fi

	@echo Getting dependencies using yarn

	yarn install --ignore-scripts --pure-lockfile

	touch $@

check-style: | pre-run .yarninstall
	@echo Checking for style guide compliance

	yarn run check


clean:
	@echo Cleaning app

	yarn cache clean --force
	rm -rf node_modules
	rm -f .yarninstall

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
	yarn test

install: .yarninstall

bundle:
	yarn run build
	yarn run webpack
