(defproject formious/formious "0.4.0-SNAPSHOT"
  :description "Experiment Server"
  ; "keywords": ["forms", "surveys"],
  ; "homepage": "https://github.com/chbrown/formious",
  ; "repository": "git://github.com/chbrown/formious.git",
  ; "author": "Christopher Brown <io@henrian.com> (http://henrian.com)",
  ; "license": "MIT",
  :url "https://formious.com/"
  :dependencies [; clj
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/java.jdbc "0.6.1"]
                 [org.postgresql/postgresql "42.0.0"]
                 [cheshire "5.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [http.async.client "1.2.0"]
                 [markdown-clj "0.9.98"]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [net.sf.supercsv/super-csv "2.4.0"]
                 [net.sf.supercsv/super-csv-java8 "2.4.0"]
                 [org.apache.poi/poi-ooxml "3.15"]
                 ; [amazonica "0.3.93"]
                 [com.amazonaws/aws-java-sdk-mechanicalturkrequester "1.11.105" :exclusions [joda-time]]
                 [org.clojure/tools.logging "0.3.1"]
                 [ch.qos.logback/logback-classic "1.2.1"]
                 ; clj/web
                 [compojure "1.6.0-beta3"]
                 [ring/ring-core "1.6.0-RC1"]
                 [ring/ring-devel "1.6.0-RC1"]
                 [ring/ring-defaults "0.3.0-beta3"]
                 [ring/ring-json "0.5.0-beta1"]
                 [http-kit "2.2.0"]
                 ; cljs
                 [bidi "2.0.16"]
                 [org.clojure/clojurescript "1.9.495"]
                 [org.clojure/core.async "0.3.442"]
                 ; avoid "cljs.core/uuid? being replaced by: cognitect.transit/uuid?" warning:
                 [com.cognitect/transit-cljs "0.8.239"]
                 [rum "0.10.8"]
                 [cljs-http "0.1.42"]]
  :plugins [[lein-cljsbuild "1.1.5"]
            [lein-figwheel "0.5.9" :exclusions [org.clojure/clojure]]]
  :clean-targets ^{:protect false} [:target-path
                                    "resources/public/build/bundle.js"
                                    "resources/public/build/out"]
  ; :production must be the first cljsbuild specified, since there is
  ; no way to select a build by name in the `lein (uber)jar` command
  :cljsbuild {:builds
              [{:id "production"
                :source-paths ["src"]
                ; :jar true ; not needed since output goes into cljs anyway
                :compiler {:output-to "resources/public/build/bundle.js"
                           :optimizations :simple
                           :pretty-print false}}
               {:id "dev"
                :figwheel true
                :source-paths ["src"]
                :compiler {:main formious.client.core ; used by figwheel
                           ; figwheel requires these build/out directives:
                           :asset-path "/build/out" ; maybe used by figwheel?
                           :output-to "resources/public/build/bundle.js"
                           :output-dir "resources/public/build/out" ; for temporary/intermediate files only
                           :preloads [devtools.preload]
                           :optimizations :none}}]}
  :figwheel {:ring-handler formious.server/reloadable-handler
             :server-port 1451
             :server-ip "127.0.0.1"
             :css-dirs ["resources/public/build"]
             :server-logfile "/tmp/formious-figwheel.log"}
  :ring {:handler formious.server/reloadable-handler
         :port 1451
         :open-browser? false}
  :main formious.server
  :profiles {:dev {:dependencies [[binaryage/devtools "0.9.2"]
                                  [figwheel-sidecar "0.5.9"]
                                  [com.cemerick/piggieback "0.2.1"]]
                   :ring {:auto-refresh? true}
                   :source-paths ["dev"]
                   :repl-options {; limit output for nREPL dev
                                  :init (set! *print-length* 100)
                                  :init-ns user
                                  ; piggieback enables cljs in nREPL
                                  :nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]}}
             :uberjar {:aot :all
                       :hooks [leiningen.cljsbuild]}
             :production {:hooks [leiningen.cljsbuild]
                          :ring {:stacktraces? false
                                 :auto-reload? false}}})
