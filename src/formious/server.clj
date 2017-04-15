(ns formious.server
  (:require [formious.db.common :refer [ZonedDateTime->String]]
            ; api handlers
            [formious.resources :as resources :refer [run]]
            ; [formious.resources :refer [access-tokens administrators aws-accounts blocks experiments responses templates]]
            ; root handlers
            [formious.handlers
             [admin :as admin]
             [root :as root]
             [mturk :as mturk]
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
  ; admin-routes
  ::routes/admin-access-token nil
  ::routes/admin-access-tokens nil
  ::routes/admin-administrator nil
  ::routes/admin-administrators nil
  ::routes/admin-aws-account nil
  ::routes/admin-aws-accounts nil
  ::routes/admin-block nil
  ::routes/admin-blocks nil
  ::routes/admin-experiment nil
  ::routes/admin-experiments nil
  ::routes/admin-login nil
  ::routes/admin-mturk nil
  ::routes/admin-mturk-dashboard nil
  ::routes/admin-mturk-hit nil
  ::routes/admin-mturk-hit-new nil
  ::routes/admin-mturk-hits nil
  ::routes/admin-mturk-qualification-type nil
  ::routes/admin-mturk-qualification-type-new nil
  ::routes/admin-mturk-qualification-types nil
  ::routes/admin-responses nil
  ::routes/admin-template admin/render-admin-template
  ::routes/admin-templates nil
  ; api-routes
  ::routes/api-access-tokens  #(run resources/access-tokens  %)
  ::routes/api-access-token   #(run resources/access-token   %)
  ::routes/api-administrators #(run resources/administrators %)
  ::routes/api-administrator  #(run resources/administrator  %)
  ::routes/api-aws-accounts   #(run resources/aws-accounts   %)
  ::routes/api-aws-account    #(run resources/aws-account    %)
  ::routes/api-experiments    #(run resources/experiments    %)
  ::routes/api-experiment     #(run resources/experiment     %)
  ::routes/api-blocks         #(run resources/blocks         %)
  ::routes/api-block-tree     #(run resources/block-tree     %)
  ::routes/api-block          #(run resources/block          %)
  ::routes/api-responses      #(run resources/responses      %)
  ::routes/api-response       #(run resources/response       %)
  ::routes/api-templates      #(run resources/templates      %)
  ::routes/api-template       #(run resources/template       %)
  ; experiment routes
  ::routes/experiment root-experiments/redirect-to-next-block
  ::routes/experiment-get-block root-experiments/render-block
  ::routes/experiment-post-block root-experiments/save-block-and-redirect
  ; base routes
  ::routes/login root/login
  ::routes/mturk mturk/post
  ::routes/mturk-submit root/mturk-submit
  ::routes/responses root/export-responses
  ::routes/echo root/echo
  ::routes/info root/info
  ::routes/parse-table root/parse-table
  ::routes/favicon root/favicon
  ::routes/file root/file
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
