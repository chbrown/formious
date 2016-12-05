NODE_PATH := $(shell npm bin)
BREW_PATH := $(shell brew --prefix)/bin

all: build/bundle.js bundle/site.css

$(BREW_PATH)/fswatch:
	brew install fswatch

$(NODE_PATH)/lessc $(NODE_PATH)/cleancss $(NODE_PATH)/webpack: # $(NODE_PATH)/tsc
	npm install less postcss-cli webpack autoprefixer

bundle/%.css: %.less $(NODE_PATH)/lessc $(NODE_PATH)/postcss $(NODE_PATH)/cleancss
	$(NODE_PATH)/lessc $< |\
	  $(NODE_PATH)/postcss --use autoprefixer |\
	  $(NODE_PATH)/cleancss --keep-line-breaks --skip-advanced -o $@

build/bundle.js: webpack.config.js build.js $(NODE_PATH)/webpack
	@mkdir -p $(@D)
	NODE_ENV=production $(NODE_PATH)/webpack --config $<

dev-css: site.less $(BREW_PATH)/fswatch
	$(BREW_PATH)/fswatch $< | xargs -I % make site.css

dev:
	(\
	  $(MAKE) dev-css & \
	  $(NODE_PATH)/webpack --config webpack.config.js --watch & \
	  wait)
