(ns formious.client.common
  (:require [clojure.string :as str]
            [formious.common :as common]))

(defn full-location
  "Returns the current full location of the window"
  []
  (str js/window.location.pathname js/window.location.search))

(defn parse-json
  "Parse JSON using native JSON.parse and convert to clj data structure"
  [string]
  (js->clj (js/JSON.parse string) :keywordize-keys true))

(defn event-value
  "Get the value of the given event's target"
  [event]
  (.. event -target -value))

(defn any-modKey?
  "Returns true if the given KeyEvent is flagged for alt/ctrl/meta(=super)/shift key state"
  [event]
  (or (.-altKey event) (.-ctrlKey event) (.-metaKey event) (.-shiftKey event)))

(defn readBinaryFile
  "readBinaryFile(file: File, callback: (error: Error, data?: Uint8Array))

  File: a native browser File object, as provided by an input[type=file]'s
  files[i] property."
  [file callback]
  (let [reader (js/FileReader.)]
    (set! (.-onerror reader) callback)
    (set! (.-onload reader) (fn []
      ; data is an arraybufferview as basic bytes / chars
      (let [data (js/Uint8Array. (.-result reader))]
        (callback nil data))))
    (.readAsArrayBuffer reader file)))

(defn parseTabularFile
  "parseTabularFile(file: File, callback: (error: Error, table?: object[]))

  File: a native browser File object, as provided by an input[type=file]'s
  files[i] property.

  This method will read the file's contents, send it via AJAX to the
  /util/parseTable endpoint to be parsed as an Excel spreadsheet or CSV, as needed."
  [file callback]
  (readBinaryFile file (fn [error data]
    (if error
      (callback error)
      ; send excel data off to the server to parse
      (let [xhr (doto (js/XMLHttpRequest.)
                      (.open "POST" "/util/parse-table")
                      (.setRequestHeader "Content-Type" file.type)
                      (.setRequestHeader "X-Filename" file.name))]
        (set! (.-onerror xhr) callback)
        (set! (.-onload xhr)
              (fn []
                (if (>= (.-status xhr) 300)
                  (callback (js/Error. (.-responseText xhr)))
                  (let [text (.-responseText xhr)
                        content_type (.getResponseHeader xhr "content-type")
                        body (if (str/includes? content_type "application/json") (parse-json text) text)]
                    (callback nil body)))))
        (.send xhr data))))))

(def cookie-defaults {:path "/"
                      ; expires one month from now
                      :expires (common/add-duration (common/now) (* 31 24 60 60 1000))})
