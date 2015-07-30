BIN := node_modules/.bin
DTS := async/async lodash/lodash node/node

all: ui/build/bundle.js ui/build/bundle.min.js ui/site.css type_declarations
type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)

type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/borisyankov/DefinitelyTyped/master/$* > $@

$(BIN)/lessc $(BIN)/cleancss $(BIN)/browserify $(BIN)/watsh $(BIN)/tsc:
	npm install

%.css: %.less $(BIN)/lessc $(BIN)/cleancss
	$(BIN)/lessc $< | $(BIN)/cleancss --keep-line-breaks --skip-advanced -o $@

# --compilation_level SIMPLE
%.min.js: %.js
	closure-compiler --angular_pass --language_in ECMASCRIPT5 --warning_level QUIET $< >$@

ui/build/bundle.js: ui/build.js $(BIN)/browserify
	mkdir -p $(@D)
	$(BIN)/browserify $< --transform babelify --outfile $@

dev: $(BIN)/watsh $(BIN)/watchify
	(\
    $(BIN)/watsh 'make ui/site.css' ui/site.less & \
    $(BIN)/watchify ui/build.js -t babelify -o ui/build/bundle.js -v & \
    wait)

deploy:
	docker pull chbrown/formious && \
    docker rm -f app && \
    docker run -d -e VIRTUAL_HOST=formious.com --link db:db --restart always --name app chbrown/formious
