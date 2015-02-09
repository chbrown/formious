# requires the angular injection annotator:
#   npm install -g ng-annotate
# and closure-compiler:
#   brew install closure-compiler

all: angular-plugins.min.js

%.min.js: %.js
	ng-annotate -a $+ | closure-compiler --language_in ECMASCRIPT5 --warning_level QUIET > $@
