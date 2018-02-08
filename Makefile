all: uberjar resources/public/build/site.css # resources/public/build/bundle.js

migrate:
	npm run-script migrate

resources/public/build/site.css: resources/site.less
	npm run-script compile-css

dev-css: resources/site.less
	fswatch $< | xargs -I % make resources/public/build/site.css

dev:
	(\
   $(MAKE) dev-css & \
   rlwrap lein figwheel & \
   wait)

uberjar:
	lein uberjar

server: uberjar
	java -jar target/formious-*-standalone.jar
