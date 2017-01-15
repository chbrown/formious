; project.clj documentation: https://github.com/technomancy/leiningen/blob/master/sample.project.clj
(defproject com.formious/app "0.2.0-SNAPSHOT"
  :description "Experiment Server"
  :url "https://formious.com/"
  ; "author": "Christopher Brown <io@henrian.com>",
  ; "keywords": ["blog"],
  :dependencies [; clj
                 [org.clojure/clojure "1.8.0"]
                 [org.clojure/java.jdbc "0.6.1"]
                 [org.postgresql/postgresql "9.4.1212"]
                 [cheshire "5.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [http.async.client "1.2.0"]
                 [markdown-clj "0.9.91"]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [net.sf.supercsv/super-csv "2.4.0"]
                 [net.sf.supercsv/super-csv-java8 "2.4.0"]
                 [org.apache.poi/poi-ooxml "3.15"]
                 ; clj/web
                 [compojure "1.6.0-beta2"]
                 [ring/ring-core "1.6.0-beta6"]
                 [ring/ring-devel "1.6.0-beta6"]
                 [ring/ring-defaults "0.3.0-beta1"] ; https://github.com/ring-clojure/ring-defaults
                 [ring/ring-json "0.5.0-beta1"] ; https://github.com/ring-clojure/ring-json
                 [http-kit "2.2.0"]
                 ; cljs
                 [bidi "2.0.16"]
                 [org.clojure/clojurescript "1.9.293"]
                 [org.clojure/core.async "0.2.395"]
                 ; avoid "cljs.core/uuid? being replaced by: cognitect.transit/uuid?" warning:
                 [com.cognitect/transit-cljs "0.8.239"]
                 [rum "0.10.7"]
                 [cljs-http "0.1.42"]]
  :plugins [[lein-cljsbuild "1.1.4"]
            [lein-figwheel "0.5.8" :exclusions [org.clojure/clojure]]]
  ; :clean-targets ^{:protect false} [:target-path "resources/public/build/main.js" "resources/public/build/out"]
  ; :production must be the first cljsbuild specified, since there is no way to select a cljsbuild by name
  ; in the `lein (uber)jar` command
  :cljsbuild {:builds
              [{:id "production"
                :source-paths ["src/"]
                ; :jar true ; not needed since output goes into cljs anyway
                :compiler {:output-to "resources/public/build/main.js"
                           :optimizations :simple
                           :pretty-print false}}
               {:id "dev"
                :figwheel true
                :source-paths ["src/"]
                :compiler {:main com.formious.client.core ; used by figwheel
                           ; figwheel requires these build/out directives:
                           :asset-path "/build/out" ; maybe used by figwheel?
                           :output-to "resources/public/build/main.js"
                           :output-dir "resources/public/build/out" ; for temporary/intermediate files only
                           :preloads [devtools.preload]
                           :optimizations :none}}]}
  :figwheel {:ring-handler com.formious.server.core/dev-handler
             :server-port 1451
             :server-ip "127.0.0.1"
             :css-dirs ["resources/public/build"]}
  :ring {:handler com.formious.server.core/handler
         :port 1451
         :open-browser? false}
  :main com.formious.server
  :profiles {:dev {:dependencies [[binaryage/devtools "0.8.3"]
                                  [figwheel-sidecar "0.5.8"]
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
