(ns formious.server
  (:gen-class)
  (:require [clojure.tools.logging :as log]
            [clojure.string :as str]
            [clojure.data.json :refer [JSONWriter write]]
            [formious.util :refer [elide]]
            [formious.store :refer [app-state dispatch!]]
            [formious.rpc] ; for the dispatch! defmethods
            [formious.actions :as actions]
            [formious.db :as db]
            [formious.resources :as resources]
            [formious.routes :as routes :refer [resolve-endpoint generate-path]]
            [formious.views :as views]
            [formious.server.resources :as server-resources]
            [formious.server.experiments :as experiments]
            [formious.server.mturk :as mturk]
            [formious.server.table :as table]
            [formious.server.experiments :as experiments]
            [formious.server.root :as root]
            [formious.server.middleware :refer [wrap-server-header wrap-checkpoints
                                                wrap-logging wrap-transit-response]]
            [ring.middleware.data.json :refer [wrap-json-request wrap-json-response]]
            [org.httpkit.server :refer [run-server]]
            [liberator.representation :refer [Representation as-response]]
            [era.format :as era-format]
            [rum.core :as rum]
            ; core ring:
            [ring.util.response :as response :refer [response header redirect]]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.lint :refer [wrap-lint]]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.params :refer [wrap-params]]))

; tell Liberator how to convert records into responses
(extend-protocol Representation
  clojure.lang.IRecord
  (as-response [this context]
    ; simply bridge Liberator's gap between record and map
    (as-response (into {} this) context)))

; tell (Liberator, a.o.) how to "write JSON of class java.time.ZonedDateTime"
(extend-protocol JSONWriter
  java.time.ZonedDateTime
  (-write [this out]
    (write (era-format/iso this) out))
  java.time.OffsetDateTime
  (-write [this out]
    (write (era-format/iso this) out)))

(defn- prerender-static-component
  "Return a function that takes a single string and wraps it in the HTML
  produced by component-fn"
  [component-fn]
  ; TODO: figure out a better way to do this, maybe with rum.server-render internals?
  (let [placeholder "__PRERENDER_CHILDREN__"
        static-markup (rum/render-static-markup (component-fn placeholder))
        [prefix suffix] (str/split static-markup (re-pattern placeholder))]
    (fn [content] (str prefix content suffix))))

(defn- render-html+static-markup-with-doctype
  "Render static (not marked with React ids & checksums) HTML, complete with DOCTYPE header"
  [static-component-fn component]
  ; TODO: memoize the fn returned by prerender-static-component
  (str "<!DOCTYPE html>"
       ((prerender-static-component static-component-fn)
        (rum/render-html component))))

(defn find-handler
  "mapping from route-endpoint + route-params to ring handler"
  [endpoint route-params]
  (let [route-keyset (-> route-params (dissoc :group) keys set)]
    (case (:group route-params)
      ; first handle the two groups of admin/api resources
      :admin (let [components (get-in views/endpoint-mapping [endpoint route-keyset])
                   component-fn (apply comp views/AppLayout components)]
               (fn [request]
                 (let [store (-> (dispatch! (actions/select endpoint (dissoc route-params :group)))
                                 (assoc :route (assoc route-params :endpoint endpoint)))]
                   (log/debug "response with store" (elide (str store) 500))
                   ; update app-state for side-effect reading in component-fn
                   (reset! app-state store)
                   (-> (render-html+static-markup-with-doctype views/AdminPage (component-fn))
                       (response)
                       ; Wrap body in a ring response map and set the content type to UTF-8 HTML
                       (response/content-type "text/html; charset=utf-8")))))
      :api   (let [resource (get-in server-resources/endpoint-mapping [endpoint route-keyset])]
               #(server-resources/run % resource))
      (case endpoint
        ; experiment routes
        ::routes/experiment experiments/redirect-to-next-block
        ::routes/experiment-get-block experiments/render-block
        ::routes/experiment-post-block experiments/save-block-and-redirect
        ; base routes
        ::routes/login root/login
        ::routes/mturk mturk/post
        ::routes/mturk-submit root/mturk-submit
        ::routes/responses root/export-responses
        ::routes/echo root/echo
        ::routes/info root/info
        ::routes/parse-table table/parse-table
        ::routes/favicon root/favicon
        ::routes/file root/file
        ::routes/root (fn [req] (redirect (generate-path {:endpoint ::routes/login})))
        root/catch-all))))

(defn- routing-ex-info
  [m request]
  (ex-info (str "Route resolution to ring handler failed "
                "while routing uri " (pr-str (:uri request)) " "
                "could not find handler for endpoint " (:endpoint m) " "
                "with route-params " (dissoc m :endpoint)) request))

(defn router
  "Take a raw HTTP request and generate a response,
  converting a routes endpoint (usually a keyword) to a proper ring handler."
  [request]
  (let [m (resolve-endpoint {:path (:uri request)})
        endpoint (:endpoint m)
        route-params (dissoc m :endpoint)
        handler (find-handler endpoint route-params)]
    ; (log/debug "handling endpoint" endpoint "via handler" handler)
    (if handler
      (handler (update request :route-params merge route-params))
      (throw (routing-ex-info m request)))))

(def ^:private session-store
  (cookie-store {:key "tE14SagkpsOXDoa1"}))

(def handler
  ; the topmost wrappers threaded here are the innermost in the stack
  ; the bottom wrapper is the first to receive the request, and the last to process the response.
  ; thus, the higher the wrapper, the more focused it is; the wrappers at the bottom can
  ; short circuit requests and decline to call higher-up handlers.
  (-> router
      ; (wrap-trace :header :ui)
      (wrap-params) ; Parse query string and url-encoded forms into :{query,form,}-params fields on the request map
      (wrap-transit-response) ; render :body to Transit format for compliant requests
      (wrap-json-request :key-fn keyword) ; parse :body on JSON requests as JSON and update :body (add :key-fn keyword if desired)
      (wrap-json-response :escape-unicode false) ; render :body to JSON on responses where (coll? body) (which strings don't, btw)
      (wrap-cookies) ; parses cookies from request; serializes cookies in response (when set-cookie has been used)
      (wrap-session {:store session-store :cookie-name "administrator_token" :cookie-attrs {:max-age (* 60 60 24 31)}}) ; 31 days in seconds
      (wrap-lint) ; wrap-lint needs to come towards the end of the handlers so the responses are already fixed
      (wrap-logging :tag "outer"))) ; logging should be outermost layer to get the original request and the final response

(def reloadable-handler
  "This handler wrapper checks for existence of an environment variable,
  LEIN_JAVA_CMD, to distinguish between `lein run` and `java -jar *-standalone.jar` usage"
  (if (some? (System/getenv "LEIN_JAVA_CMD"))
    (do
      (log/warn "wrapping server handler in reloader")
      ; wrap-reload requires a bit more syntax/indirection since we
      ; have to refer to the var, not the value
      (wrap-reload #'handler))
    handler))

(defn -main
  "Command line interface entry point to start the formious server.
  `port` should be provided as a string; if it is omitted:
  1) will use the PORT environment variable
  2) defaulting to 1451 if all else fails"
  ([] (-main (or (System/getenv "PORT") "1451")))
  ([port]
   (println "Starting server via formious.server/-main")
   (println (str "Listening on :" port))
   (run-server (wrap-server-header reloadable-handler "http-kit") {:port (Integer/parseInt port)})))
