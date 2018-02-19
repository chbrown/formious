(defproject formious/formious "0.4.0-SNAPSHOT"
  :description "Experiment Server"
  :url "https://formious.com/"
  :license {:name "MIT"
            :url "https://chbrown.github.io/licenses/MIT/#2011-2018"}
  :pom-addition [:developers [:developer
                              [:name "Christopher Brown"]
                              [:email "io@henrian.com"]]]
  :dependencies [; clj
                 [org.clojure/clojure "1.9.0"]
                 [org.clojure/java.jdbc "0.7.5"]
                 [org.postgresql/postgresql "42.2.1"]
                 [honeysql "0.9.1"]
                 [chbrown/data.json "0.2.7"]
                 [com.cognitect/transit-clj "0.8.300"]
                 [http.async.client "1.2.0"]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [net.sf.supercsv/super-csv "2.4.0"]
                 [net.sf.supercsv/super-csv-java8 "2.4.0"]
                 [org.apache.poi/poi-ooxml "3.17"]
                 [com.amazonaws/aws-java-sdk-mechanicalturkrequester "1.11.280" :exclusions [commons-logging joda-time]]
                 [org.clojure/tools.logging "0.4.0"]
                 [ch.qos.logback/logback-classic "1.2.3"]
                 ; clj/web
                 [ring/ring-core "1.6.3"]
                 [ring/ring-devel "1.6.3"]
                 [chbrown/ring-data.json "0.1.0"]
                 [liberator "0.15.1"]
                 [http-kit "2.2.0"]
                 ; cljs
                 [routes "0.5.0"]
                 [org.clojure/clojurescript "1.9.946"]
                 [org.clojure/core.async "0.4.474"]
                 ; avoid "cljs/uuid? being replaced by: cognitect.transit/uuid?" warning:
                 [com.cognitect/transit-cljs "0.8.243"]
                 [rum "0.11.1"]
                 [era "0.2.3"] ; personal library for datetime processing
                 [jurl "0.1.1"] ; personal library for URL processing
                 [cljs-http "0.1.44"]]
  :exclusions [org.clojure/data.json]
  :plugins [[lein-cljsbuild "1.1.7"]
            [lein-ring "0.12.3" :exclusions [org.clojure/clojure]]
            [lein-figwheel "0.5.14" :exclusions [org.clojure/clojure]]]
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
                :figwheel {:on-jsload formious.client/figwheel-on-jsload!}
                :source-paths ["src"]
                :compiler {:main formious.client ; used by figwheel
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
  :profiles {:dev {:dependencies [[binaryage/devtools "0.9.9"]
                                  [figwheel-sidecar "0.5.14" :exclusions [org.clojure/tools.nrepl]]
                                  [com.cemerick/piggieback "0.2.2"]
                                  [fancy "0.1.0"]
                                  [org.clojure/tools.namespace "0.3.0-alpha3"]]
                   :ring {:auto-refresh? true}
                   :source-paths ["src" "dev"]
                   :repl-options {:init-ns user
                                  ; piggieback enables cljs in nREPL
                                  :nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]}}
             :uberjar {:aot :all
                       :hooks [leiningen.cljsbuild]}
             :production {:hooks [leiningen.cljsbuild]
                          :ring {:stacktraces? false
                                 :auto-reload? false}}})
