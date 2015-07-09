BIN := node_modules/.bin

all: ui/build/bundle.js ui/build/bundle.min.js ui/site.css

$(BIN)/lessc $(BIN)/cleancss $(BIN)/browserify:
	npm install

%.css: %.less $(BIN)/lessc $(BIN)/cleancss
	$(BIN)/lessc $< | $(BIN)/cleancss --keep-line-breaks --skip-advanced -o $@

# --compilation_level SIMPLE
%.min.js: %.js
	closure-compiler --angular_pass --language_in ECMASCRIPT5 --warning_level QUIET $< >$@

ui/build/bundle.js: ui/build.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify $< --transform babelify --outfile $@

dev: $(BIN)/watchify
	$(BIN)/watchify ui/build.js --transform babelify --outfile ui/build/bundle.js -v

deploy:
	docker pull chbrown/formious && \
    docker rm -f app && \
    docker run -d -e VIRTUAL_HOST=formious.com --link db:db --restart always --name app chbrown/formious
