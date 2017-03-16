(ns formious.server
  (:require [formious.routes :refer [routes]]
            [org.httpkit.server :refer [run-server]]
            [ring.util.request :refer [path-info]]
            [ring.util.response :refer [header]]
            [cheshire.generate :refer [add-encoder]]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]])
  (:gen-class))

(def custom-site-defaults
  (-> site-defaults
      ; TODO: figure out why (assoc-in site-defaults [:params :keywordize] true) doesn't do anything
      (assoc-in [:params :keywordize] true) ; this doesn't seem to work... at least not for query params
      (assoc-in [:security :anti-forgery] false))) ; disable this for now - TODO: worry about security later


; cheshire.core/generate-string automatically picks this up inside the wrap-json-response middleware
(add-encoder java.time.ZonedDateTime (fn [zoned-date-time jsonGenerator] ; encode-ZonedDateTime
                                       (->> zoned-date-time
                                            (.toInstant)
                                            (.toString)
                                            (.writeString jsonGenerator))))

(defn wrap-server-header
  [handler server]
  (fn [request]
    (header (handler request) "Server" server)))

(defn wrap-reload-in-dev
  "check for existence of LEIN_JAVA_CMD environment variable to distinguish between
  `lein run` calls and `java -jar *-standalone.jar` calls"
  [handler]
  (let [in-dev? (some? (System/getenv "LEIN_JAVA_CMD"))]
    (when in-dev? (println "-- wrapping development server handler in reloader --"))
    (if in-dev?
      (-> handler
          (wrap-server-header "http-kit[dev]")
          (wrap-reload))
      handler)))

(def handler
  (-> routes
      (wrap-cookies)
      (wrap-json-response) ; render JSON responses out of collections (which strings aren't)
      (wrap-json-body) ; parse JSON request bodies
      (wrap-defaults custom-site-defaults)
      (wrap-reload-in-dev)))

(defn -main
  ; banner("formious --port 1451 -v")
  ; val hostname = opt[String]("hostname", descr="hostname to listen on", default=Some(sys.env.getOrElse("HOSTNAME", "127.0.0.1")))
  ; val port = opt[Int]("port", 'p', descr="port to listen on", default=Some(sys.env.getOrElse("PORT", "80").toInt))
  ([] (-main (or (System/getenv "PORT") "1451")))
  ([port]
   (println "Starting server via formious.server/-main")
   (println (str "Listening on :" port))
   (run-server handler {:port (Integer/parseInt port)})))
