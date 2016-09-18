NODE_PATH := $(shell npm bin)

all:

$(NODE_PATH)/sql-patch:
	npm install sql-patch

migrate: $(NODE_PATH)/sql-patch
	$< migrations/ --database formious --name _migrations
