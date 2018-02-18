(ns formious.client.table
  (:require [clojure.string :as str]
            [formious.util :refer [read-json-str]]))

(defn- read-bytes
  "Use a native FileReader to read `file` in ArrayBuffer mode,
  producing a Uint8Array instance.

  `file`: File (a native browser File object, as provided by an input[type=file]'s files[i] property)
  `callback`: (error: Error, data?: Uint8Array) => void"
  [file callback]
  (let [reader (js/FileReader.)]
    (set! (.-onerror reader) callback)
    ; callback with an arraybufferview as basic bytes / chars
    (set! (.-onload reader) #(callback nil (js/Uint8Array. (.-result reader))))
    (.readAsArrayBuffer reader file)))

(defn- parse-xhr-response
  "Return a map like {:status 200 :body <...>} from the contents
  of the (presumably fulfilled) XMLHttpRequest instance, `xhr`."
  [xhr]
  (let [status (.-status xhr)
        content-type (.getResponseHeader xhr "Content-Type")
        ; parse response as JSON if the content-type header contains "application/json"
        body (cond-> (.-responseText xhr)
               (str/includes? content-type "application/json") (read-json-str))]
    {:status status :body body}))

(defn- send-parse-table-xhr
  [data content-type filename callback]
  (let [xhr (doto (js/XMLHttpRequest.)
                  (.open "POST" "/util/parse-table")
                  (.setRequestHeader "Content-Type" content-type)
                  (.setRequestHeader "X-Filename" filename))]
    (set! (.-onerror xhr) callback)
    (set! (.-onload xhr) (fn []
                           (let [{:keys [status body]} (parse-xhr-response xhr)]
                             (if (>= status 300)
                               (callback (js/Error. body))
                               (callback nil body)))))
    (.send xhr data)))

(defn parse-tabular-file
  "read the file's contents; send it via AJAX to the /util/parseTable endpoint
  to be parsed as an Excel spreadsheet or CSV, as needed.

  `file`: File (a native browser File object, as provided by an input[type=file]'s files[i] property)
  `callback`: (error: Error, table?: object[]) => void"
  [file callback]
  (read-bytes file (fn [error data]
                     (if error
                       (callback error)
                       ; send excel data off to the server to parse
                       (send-parse-table-xhr data (.-type file) (.-name file) callback)))))
