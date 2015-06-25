BIN := node_modules/.bin

all: ui/build/bundle.js ui/build/bundle.min.js ui/site.css

$(BIN)/lessc $(BIN)/cleancss $(BIN)/browserify:
	npm install

%.css: %.less $(BIN)/lessc $(BIN)/cleancss
	$(BIN)/lessc $< | $(BIN)/cleancss --keep-line-breaks --skip-advanced -o $@

%.min.js: %.js
	closure-compiler --angular_pass --language_in ECMASCRIPT5 --warning_level QUIET --compilation_level SIMPLE $< >$@

ui/build/bundle.js: ui/build.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify $< --transform babelify --outfile $@

dev: $(BIN)/watchify
	$(BIN)/watchify ui/build.js --transform babelify --outfile ui/build/bundle.js -v
