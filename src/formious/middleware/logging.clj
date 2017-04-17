(ns formious.middleware.logging
  (:require [formious.routes :as routes]
            [formious.common :as common]
            [clojure.tools.logging :as log]
            [ring.util.request :as request]
            [ring.util.response :as response]))

(defn wrap-server-header
  "middleware that adds a 'Server: <server>' header to the response"
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

; cf. https://github.com/nberger/ring-logger

(defn- redact-in
  [m ks]
  (common/assoc-in-when m ks "❌ ")) ; maybe ❌ or … or ⋯

(defn wrap-logging
  "middleware that logs requests and responses"
  [handler & {:keys [tag request-redactions response-redactions]
              :or   {request-redactions [[:remote-addr]
                                         [:headers "user-agent"]
                                         [:headers "cookie"]
                                         [:headers "connection"]
                                         [:headers "accept"]
                                         [:headers "accept-language"]
                                         [:headers "accept-encoding"]
                                         [:async-channel]]
                     response-redactions [[:body]
                                          [:headers "Last-Modified"]]}
              :as options}]
  (fn logging-handler [request]
    (let [redacted-request (reduce redact-in request request-redactions)]
      (log/debug "📨 ➙  (request)" tag redacted-request))
    (let [response (handler request)]
      (let [redacted-response (reduce redact-in response response-redactions)]
        (log/debug "📬  ⬅ (response)" tag redacted-response))
      response)))
