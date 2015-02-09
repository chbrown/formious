all: static/lib.min.js static/lib.max.js static/site.css

%.css: %.less
	lessc $+ | cleancss --keep-line-breaks --skip-advanced -o $@

# Use | to skip existing files
static/lib/%.min.js: | static/lib/%.js
	ng-annotate -a $| | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@

SCRIPTS = jquery angular angular-resource angular-ui-router ngStorage \
	lodash cookies forms textarea url
# Variable substitution in Make; the following finds all whitespace-separated
# words in $(VARIABLE), and returns each word with static/ in front of it. The
# first % sign is like \w+, while the second is like $0, in regex terms.
#   	$(VARIABLE:%=static/%)
static/lib.min.js: $(SCRIPTS:%=static/lib/%.min.js)
	closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET --js $+ > $@
static/lib.max.js: $(SCRIPTS:%=static/lib/%.js)
	cat $+ > $@
