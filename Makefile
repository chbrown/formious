NODE_PATH := $(shell npm bin)
BREW_PATH := $(shell brew --prefix)/bin

all: uberjar resources/public/build/site.css # resources/public/build/bundle.js

$(NODE_PATH)/sql-patch:
	npm install sql-patch

$(BREW_PATH)/fswatch:
	brew install fswatch

migrate: $(NODE_PATH)/sql-patch
	$< migrations/ --database formious --name _migrations

resources/public/build/site.css: resources/site.less
	npm run-script compile-css

dev-css: resources/site.less $(BREW_PATH)/fswatch
	$(BREW_PATH)/fswatch $< | xargs -I % make resources/public/build/site.css

dev:
	(\
   $(MAKE) dev-css & \
   rlwrap lein figwheel & \
   wait)

uberjar:
	lein uberjar

server: uberjar
	java -jar target/formious-*-standalone.jar
