(ns formious.server
  (:require [formious.db.common :refer [ZonedDateTime->String]]
            ; api handlers
            [formious.resources
             [access-tokens :as access-tokens]
             [administrators :as administrators]
             [aws-accounts :as aws-accounts]
             [blocks :as blocks]
             [experiments :as experiments]
             [file :as file]
             [info :as info]
             [mturk :as mturk]
             [responses :as responses]
             [templates :as templates]]
            ; root handlers
            [formious.handlers
             [root :as root]
             [experiments :as root-experiments]]
            [formious.routes :as routes]
            [formious.middleware.logging :refer [wrap-server-header wrap-checkpoints wrap-logging]]
            [ring.middleware.data.json :refer [wrap-json-request wrap-json-response]]
            [org.httpkit.server :refer [run-server]]
            [bidi.ring :refer [make-handler]]
            [liberator.representation :refer [Representation as-response]]
            [clojure.data.json :refer [JSONWriter write]]
            [clojure.tools.logging :as log]
            ; core ring:
            [ring.util.response :refer [response header]]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.lint :refer [wrap-lint]]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.params :refer [wrap-params]])
  (:import (java.time ZonedDateTime))
  (:gen-class))

; tell Liberator how to convert records into responses
(extend-protocol Representation
  clojure.lang.IRecord
  (as-response [this context]
    ; simply bridge Liberator's gap between record and map
    (as-response (into {} this) context)))
; tell Liberator how to "write JSON of class java.time.ZonedDateTime"
(extend-protocol JSONWriter
  ZonedDateTime
  (-write [this out]
    (write (ZonedDateTime->String this) out)))

(def route->handler {
  ; api-routes
  ::routes/api-access-tokens access-tokens/access-tokens
  ::routes/api-access-token access-tokens/access-token
  ::routes/api-administrators administrators/administrators
  ::routes/api-administrator administrators/administrator
  ::routes/api-aws-accounts aws-accounts/aws-accounts
  ::routes/api-aws-account aws-accounts/aws-account
  ::routes/api-experiments experiments/experiments
  ::routes/api-experiment experiments/experiment
  ::routes/api-blocks blocks/blocks
  ::routes/api-block-tree blocks/block-tree
  ::routes/api-block blocks/block
  ::routes/api-responses responses/responses
  ::routes/api-response responses/response
  ::routes/api-templates templates/templates
  ::routes/api-template templates/template
  ::routes/api-mturk mturk/mturk
  ; experiment routes
  ::routes/experiment root-experiments/redirect-to-next-block
  ::routes/experiment-get-block root-experiments/render-block
  ::routes/experiment-post-block root-experiments/save-block-and-redirect
  ; base routes
  ::routes/login root/login
  ::routes/mturk-submit root/mturk-submit
  ::routes/responses root/export-responses
  ::routes/echo root/echo
  ::routes/info info/info
  ::routes/parse-table root/parse-table
  ::routes/layout root/generate-layout
  ::routes/file file/file
  ::routes/default root/catch-all})

(def routes-with-default ["" [routes/routes
                              ; wildcard catch-all
                              [true ::routes/default]]])

(def handler
  ; the topmost wrappers threaded here are the innermost in the stack
  ; the bottom wrapper is the first to receive the request, and the last to process the response.
  ; thus, the higher the wrapper, the more focused it is; the wrappers at the bottom can
  ; short circuit requests and decline to call higher-up handlers.
  (-> (make-handler routes-with-default route->handler)
      ; (wrap-trace :header :ui)
      (wrap-params) ; Parse query string and url-encoded forms into :{query,form,}-params fields on the request map
      (wrap-json-request) ; parse :body on JSON requests as JSON and update :body (add :key-fn keyword if desired)
      (wrap-json-response) ; render :body to JSON on responses where (coll? body) (which strings don't, btw)
      (wrap-cookies) ; parses cookies from request; serializes cookies in response (when set-cookie has been used)
      (wrap-lint) ; wrap-lint needs to come towards the end of the handlers so the responses are already fixed
      (wrap-logging :tag "outer"))) ; logging should be outermost layer to get the original request and the final response

(def reloadable-handler
  (if (some? (System/getenv "LEIN_JAVA_CMD"))
    (do
      (log/warn "wrapping server handler in reloader")
      ; wrap-reload requires a bit more syntax/indirection since we
      ; have to refer to the var, not the value
      (wrap-reload #'handler))
    handler))

(defn -main
  ; banner("formious --port 1451 -v")
  ; val hostname = opt[String]("hostname",
  ;   descr="hostname to listen on",
  ;   default=Some(sys.env.getOrElse("HOSTNAME", "127.0.0.1")))
  ; val port = opt[Int]("port", 'p', descr="port to listen on", default=Some(sys.env.getOrElse("PORT", "80").toInt))
  ([] (-main (or (System/getenv "PORT") "1451")))
  ([port]
   (println "Starting server via formious.server/-main")
   ; check for existence of LEIN_JAVA_CMD environment variable to distinguish between
   ; `lein run` calls and `java -jar *-standalone.jar` calls
   (println (str "Listening on :" port))
   (run-server (wrap-server-header reloadable-handler "http-kit") {:port (Integer/parseInt port)})))
