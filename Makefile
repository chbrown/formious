NODE_PATH := $(shell npm bin)
BREW_PATH := $(shell brew --prefix)/bin

all: uberjar resources/public/build/site.css

$(NODE_PATH)/sql-patch:
	npm install sql-patch

$(BREW_PATH)/fswatch:
	brew install fswatch

$(NODE_PATH)/lessc $(NODE_PATH)/postcss $(NODE_PATH)/cleancss:
	npm install less postcss-cli autoprefixer clean-css

migrate: $(NODE_PATH)/sql-patch
	$< migrations/ --database formious --name _migrations

resources/public/build/site.css: src/site.less $(NODE_PATH)/lessc $(NODE_PATH)/postcss $(NODE_PATH)/cleancss
	$(NODE_PATH)/lessc $< | $(NODE_PATH)/postcss --use autoprefixer | $(NODE_PATH)/cleancss --keep-line-breaks --skip-advanced -o $@

dev-css: src/site.less $(BREW_PATH)/fswatch
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
