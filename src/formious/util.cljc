(ns formious.util
  "This module provides general-purpose utility functions.
  It should be considered a private API, used only by other modules in formious."
  (:require [clojure.string :as str]
            [cognitect.transit :as transit]
            #?(:clj [clojure.data.json])))

;; clojure.core add-ons

(defn update-when
  "Like (update m k f & args) but only calls f if m contains k"
  [m k f & args]
  (if (contains? m k) (apply update m k f args) m))

(defn update-in-when
  "Like (update-in m ks f & args) but only calls f and sets the value if (get-in m ks) is not nil"
  [m [k & ks] f & args]
  (if (contains? m k)
    ; alright, we haven't hit a dead end yet...
    (if ks
      ; there's more keys to dig into: keep recursing
      (assoc m k (apply update-in-when (get m k) ks f args))
      ; we're at the leaf to change: update it
      (assoc m k (apply f (get m k) args)))
    ; there's nothing to update: stop
    m))

(defn assoc-in-when
  "Like (assoc-in m ks v) but only uses v if (get-in m ks) is not nil"
  [m [k & ks] v]
  (if (contains? m k)
    ; alright, we haven't hit a dead end yet...
    (if ks
      ; there's more keys to dig into: keep recursing
      (assoc m k (assoc-in-when (get m k) ks v))
      ; we're at the leaf to change: set it
      (assoc m k v))
    ; there's nothing to update: stop
    m))

(defn unique-keys
  "Get a unique sorted list of the union of all keys in maps"
  [maps]
  (->> (mapcat keys maps)
       (set)
       (sort)))

(defn map-values
  "Contruct a new hash-map by calling (f v) for all kv pairs in m"
  [f m]
  (reduce-kv (fn [o k v] (assoc o k (f v))) (empty m) m))

(defn map-keys
  "Contruct a new hash-map with all the keys of the given map m passed through f"
  [f m]
  (into {} (for [[k v] m] {(f k) v})))

(defn keyed
  "Construct a hash-map from `xs`, where each value `x` in `xs` is paired with
  the key returned by `(f x)`."
  [f xs]
  (into {} (map (juxt f identity) xs)))

;; clojure.string add-ons

(defn elide
  "Shorten s to length at most n and append U+2026 (HORIZONTAL ELLIPSIS) if shortened"
  [s n]
  {:pre [(pos? n)]}
  (if (> (count s) n)
    (str (subs s 0 (dec n)) "…")
    s))

(defn pluralize
  "Add 's' to `singular` when `coll` is not 1-long; otherwise return `singular` unchanged"
  [singular coll]
  (cond-> singular
    (not= 1 (count coll)) (str "s")))

(defn random-string
  "Generate random string of `n` characters, by sampling with replacement.
  Uses a `population` of alphanumeric characters by default."
  ([n]
   (random-string n "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"))
  ([n population]
   (str/join (repeatedly n #(rand-nth population)))))

;; tree-structure tools (functionality akin to clojure.walk, but specialized for our data structures)

(defn- node?
  "Returns true if `node`'s children (if it has any) are all nodes.
  The given `node` must be a map."
  [node]
  {:pre [(map? node)]}
  (every? node? (:children node)))

(defn filter-recursively
  "Recursively filter through the `nodes` tree,
  retaining only the nodes for which (pred node) returns true."
  [nodes pred]
  {:pre [(every? node? nodes) (ifn? pred)]}
  (map #(update % :children filter-recursively pred) (filter pred nodes)))

(defn map-recursively
  "Recursively map the `nodes` tree, replacing each node with (f node)."
  [nodes f]
  {:pre [(every? node? nodes) (ifn? f)]}
  (map #(update % :children map-recursively f) nodes))

(defn search
  "Return a lazy sequence of all nodes in the `nodes` tree for which (pred node) returns true."
  [nodes pred]
  {:pre [(every? node? nodes) (ifn? pred)]}
  (filter pred (tree-seq node? :children nodes)))

;; string parsing

(defn- ex-no-matching-clause
  "Generate error like that thrown by condp when no clause matches and no default expression is provided"
  [value]
  #?(:clj  (java.lang.IllegalArgumentException. (str "No matching clause: " value))
     :cljs (js/Error. (str "IllegalArgument: No matching clause: " value))))

(defn as-long
  "Convert to a java.lang.Long (JVM) or js/Number (JavaScript), parsing if needed."
  [number]
  #?(:clj  (condp instance? number
             ; nil number
             Long number
             Integer (long number)
             String (Long/parseLong number))
     :cljs (cond
             ; (nil? number) number
             (number? number) number
             (string? number) (js/parseInt number 10)
             ; throw to match condp behavior in :clj branch
             :else (throw (ex-no-matching-clause number)))))

;; duration parsing/formatting (era does not currently support duration/period types)

(def duration-units
  [{:unit "d" :seconds 86400}
   {:unit "h" :seconds 3600}
   {:unit "m" :seconds 60}
   {:unit "s" :seconds 1}])

(defn duration-unit->seconds
  [unit]
  (->> duration-units (filter #(= unit (:unit %))) first :seconds))

(defn parse-duration-string
  "take a string, return a number
  e.g., '5h' -> 5*60*60, the number of seconds in five hours"
  [s]
  (->> (re-seq #"(\d+)(\w)" s)
       (map (fn [_ unit-n unit]
              (* (duration-unit->seconds unit) unit-n)))
       (apply +)))

(defn format-duration-string
  [total-seconds]
  (loop [parts []
         remaining-seconds total-seconds]
    (if-not (pos? remaining-seconds)
      (str/join " " parts)
      (let [{:keys [unit seconds]} (first (filter #(> remaining-seconds (:seconds %)) duration-units))
            unit-n (quot remaining-seconds seconds)
            part (str unit-n unit)]
        (recur (conj parts part) (- remaining-seconds (* unit-n seconds)))))))

;; JSON parsing/serialization

(defn write-json-str
  "Render `x` as a string in compact JSON format"
  [x]
  #?(:clj  (clojure.data.json/write-str x)
     :cljs (js/JSON.stringify x)))

(defn read-json-str
  "Parse string `s` using data.json (JVM) or JSON.parse (JavaScript)
  and return native Clojure data structure"
  [s]
  #?(:clj  (clojure.data.json/read-str s :key-fn keyword)
     :cljs (js->clj (js/JSON.parse s) :keywordize-keys true)))

;; Transit parsing/serialization

(defn write-transit-str
  "Render `x` as a string in Transit JSON format."
  [x]
  #?(:clj  (with-open [baos (java.io.ByteArrayOutputStream.)]
             (let [custom-handlers {java.time.ZonedDateTime
                                    ; m is the established tag for "point in time"
                                    ; https://github.com/cognitect/transit-format
                                    (transit/write-handler "m"
                                      #(.toEpochMilli (.toInstant ^java.time.ZonedDateTime %))
                                      #(str (.toEpochMilli (.toInstant ^java.time.ZonedDateTime %))))}
                   transit-writer (transit/writer baos :json {:handlers custom-handlers})]
               (transit/write transit-writer x)
               (-> (.toString baos)
                   ; replace / with \/ (not required, but handy for embedded HTML)
                   (str/replace "/" "\\/"))))
     :cljs (let [transit-writer (transit/writer :json)]
             (transit/write transit-writer x))))

(defn read-transit-str
  "Parse the string `s` as Transit JSON and return the resulting value."
  [s]
  #?(:clj  (with-open [string-reader (java.io.StringReader. s)]
             (let [transit-reader (transit/reader string-reader :json)]
               (transit/read transit-reader)))
     :cljs (let [transit-reader (transit/reader :json)]
             (transit/read transit-reader s))))
