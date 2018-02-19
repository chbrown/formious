(ns formious.server.middleware
  (:require [clojure.string :as str]
            [clojure.tools.logging :as log]
            [ring.util.request :as request]
            [ring.util.response :as response]
            [formious.util :refer [assoc-in-when write-transit-str]]))

(defn wrap-server-header
  "middleware that adds a 'Server' header to the response"
  [handler server]
  (fn server-header-handler [request]
    (response/header (handler request) "Server" server)))

(defn wrap-checkpoints
  "middleware that logs when a request is received and when the response is relayed back"
  [handler & tags]
  (fn checkpoint-handler [request]
    (log/trace "📨  (handling request)" ~@tags)
    (let [response (handler request)]
      (log/trace "📬  (handling response)" ~@tags)
      response)))

(defn- redact-in
  [m ks]
  (assoc-in-when m ks "⋯ ")) ; maybe ❌ or … or ⋯

(defn wrap-logging
  "Middleware that logs requests and responses.
  Cf. https://github.com/nberger/ring-logger"
  [handler & {:keys [tag request-redactions response-redactions]
              :or   {request-redactions  #{[:remote-addr]
                                           [:headers "user-agent"]
                                           [:headers "cookie"]
                                           [:headers "connection"]
                                           [:headers "accept"]
                                           [:headers "accept-language"]
                                           [:headers "accept-encoding"]
                                           [:async-channel]}
                     response-redactions #{[:body]
                                           [:headers "Last-Modified"]}}
              :as options}]
  (fn logging-handler [request]
    (let [redacted-request (reduce redact-in request request-redactions)]
      (log/debug "📨 ➙  (request)" tag redacted-request))
    (let [response (handler request)]
      (let [redacted-response (reduce redact-in response response-redactions)]
        (log/debug "📬  ⬅ (response)" tag redacted-response))
      response)))

(defn wrap-transit-response
  "Middleware to serialize :body in responses as transit format iff:
  - (coll? :body) AND
  - the request headers include 'Accept: application/transit+json'"
  [handler & {:keys [mime-type]
              :or   {mime-type "application/transit+json"}}]
  (fn transit-response-handler [request]
    (let [response (handler request)]
      (if (and (coll? (:body response))
               (str/includes? (get-in response [:headers "accept"]) mime-type))
        (-> (update-in response [:body] write-transit-str)
            (response/content-type mime-type))
        response))))
