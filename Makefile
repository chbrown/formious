all: static/lib.min.js static/lib.max.js

# --compilation_level ADVANCED_OPTIMIZATIONS
CCFLAGS = --language_in ECMASCRIPT5 --warning_level QUIET

# VENDOR scripts have minified versions already
VENDOR = underscore jquery angular angular-resource angular-ui-router ngStorage
# MISCJS scripts only have a single (non-minimized) form
MISCJS = cookies forms textarea url

# Variable substitution in Make; the following finds all whitespace-separated
# words in $(VARIABLE), and returns each word with static/ in front of it. The
# first % sign is like \w+, while the second is like $0, in regex terms.
#   	$(VARIABLE:%=static/%)

static/lib.min.js:
	closure-compiler $(CCFLAGS) --js $(VENDOR:%=static/lib/%.min.js) $(MISCJS:%=static/lib/%.js) > $@

static/lib.max.js:
	cat $(VENDOR:%=static/lib/%.js) $(MISCJS:%=static/lib/%.js) > $@
