(ns formious.common
  (:require [bidi.bidi :as bidi]
            [clojure.string :as str]
            #?(:cljs [goog.net.cookies])
            [formious.routes :refer [routes]]))

; (defn match-route
;   [path & options]
;   (apply bidi/match-route routes path options))
(def match-route (partial bidi/match-route routes))

(defn path-for
  [handler & params]
  (let [namespaced-handler (keyword (name :formious.routes) (name handler))]
    (apply bidi/path-for routes namespaced-handler params)))

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

(defn map-kv
  "Create a new hash by calling (f v) for all kv pairs in m"
  [f m]
  (reduce-kv (fn [o k v] (assoc o k (f v))) (empty m) m))

(defn map-keys
  "contruct a new map with all the keys of the given map m passed through f"
  [f m]
  (into {} (for [[k v] m] {(f k) v})))

(defn elide
  "Shorten s to length at most n + 3 and append ellipsis if shortened"
  [s n]
  (if (> (count s) n)
    (str (subs s 0 n) "...")
    s))

(defn pluralize
  "Add 's' to singular when array is not 1-long; otherwise return singular unchanged"
  [singular array]
  (when (= 1 (count array)) singular (str singular "s")))

; interface Node {children: Node[]}
; The `nodes` argument to each static function should implement the Node interface above.

(defn recursiveFilter
  "Returns new Nodes"
  [nodes predicateFunction]
  (->> (filter predicateFunction nodes)
       (map #(update % :children recursiveFilter predicateFunction))))

(defn recursiveTransform
  "Returns new Nodes"
  [nodes transformFunction]
  (map #(update % :children recursiveTransform transformFunction) nodes))

(defn depthFirstSearch
  "This is a search function, and doesn't copy anything, because it doesn't change anything."
  [nodes predicateFunction]
  (mapcat (fn [node]
            (concat (when (predicateFunction node) (list node))
                    (depthFirstSearch (:children node) predicateFunction))) nodes))

(defn- build-blocks-tree-reducer
  "Used by reduce function in build-blocks-tree"
  [[root_blocks block_hash] {:keys [parent_block_id] :as block}]
  (if parent_block_id
    [root_blocks (update-in block_hash [parent_block_id :children] conj block)]
    ; else: blocks with no parent_block_id are added to the root list
    [(conj root_blocks block) block_hash]))

(defn build-blocks-tree
  "Reconstruct block tree from flat list of blocks in an experiment."
  ; (query-blocks params build-blocks-tree)
  [all_blocks]
  (let [block_hash (into {} (map (fn [block] {(:id block) (assoc block :children [])})))
        [root_blocks block_hash] (reduce build-blocks-tree-reducer [[] block_hash] all_blocks)]
    root_blocks))

(defn no-matching-clause-error
  "Generate error like that thrown by condp when no clause matches and no default expression is provided"
  [value]
  #?(:clj (java.lang.IllegalArgumentException. (str "No matching clause: " value))
     :cljs (js/Error. (str "IllegalArgument: No matching clause: " number))))

(defn ->long
  "Convert to Long, parsing if needed"
  [number]
  #?(:clj (condp instance? number
            Long number
            Integer (long number)
            String (Long/parseLong number))
     :cljs (cond
             (number? number) number
             (string? number) (js/parseInt number 10)
             ; throw to match condp behavior in :clj branch
             :else (throw (no-matching-clause-error number)))))

(defn now
  "Return the current datetime as a java.time.ZonedDateTime on the JVM, or a Date instance in JavaScript"
  []
  #?(:clj (java.time.ZonedDateTime/now)
     :cljs (js/Date.)))

(defn ->Instant
  "In Clojure, coerce several types of Java dates to a java.time.Instant instance.
  In ClojureScript, coerce to a js/Date instance.
  Throws IllegalArgumentException if it doesn't recognize type of date."
  [date]
  #?(:clj (condp instance? date
            java.time.Instant date
            java.sql.Timestamp (.toInstant ^java.sql.Timestamp date)
            java.util.Date (.toInstant ^java.util.Date date)
            java.time.ZonedDateTime (.toInstant ^java.time.ZonedDateTime date)
            String (java.time.Instant/parse date))
     :cljs (cond
             (instance? js/Date date) date
             (string? date) (js/Date. date)
             ; throw to match condp behavior in :clj branch
             :else (throw (no-matching-clause-error date)))))

(defn ->ZonedDateTime
  "Coerce several types of Java dates to a java.time.ZonedDateTime instance (no-op in CLJS).
  Throws IllegalArgumentException if it doesn't recognize type of date."
  [date]
  #?(:clj (condp instance? date
            java.time.ZonedDateTime date
            ; TODO: verify that this timezone handling is correct
            java.time.Instant (.atZone ^java.time.Instant date (java.time.ZoneId/systemDefault))
            java.sql.Timestamp (->ZonedDateTime (.toInstant ^java.sql.Timestamp date))
            String (java.time.ZonedDateTime/parse date))))

(defn ->Timestamp
  "Coerce several types of Java dates to a java.sql.Timestamp instance (no-op in CLJS).
  Throws IllegalArgumentException if it doesn't recognize type of date."
  [date]
  #?(:clj (condp instance? date
            java.sql.Timestamp date
            java.time.Instant (java.sql.Timestamp/from ^java.time.Instant date)
            ; all the others convert to Instant first and then continue as above
            java.time.ZonedDateTime (-> date ->Instant ->Timestamp)
            String (-> date ->Instant ->Timestamp))))

(defn ->iso
  "Convert most kinds of Java and JavaScript dates instances to a standard ISO-8601 string (using UTC).
  In Clojure, throws on nil; in ."
  [date]
  #?(:clj (condp instance? date
            String date
            java.time.Instant (.toString ^java.time.Instant date)
            ; all the others pass through Instant and then continue as above
            java.sql.Timestamp (-> date ->Instant ->iso)
            java.util.Date (-> date ->Instant ->iso)
            ; ZonedDateTime's toString looks like "2016-07-04T13:41:28.365-05:00[America/Chicago]"
            ; (.. zdt toOffsetDateTime toString) would probably work just as well, but not be in UTC
            java.time.ZonedDateTime (-> date ->Instant ->iso))
     :cljs (cond
             (string? date) date
             (instance? js/Date date) (.toISOString ^js/Date date)
             ; otherwise, convert to Instant first
             :else (-> date ->Instant ->iso))))

(defn add-duration
  "Add a duration (specified in milliseconds) to a date"
  [date milliseconds]
  #?(:clj (condp instance? date
            ; both Instant and ZonedDateTime natively support adding milliseconds and returning a copy of the same type
            java.time.Instant (.plusMillis ^java.time.Instant date milliseconds)
            ; oddly, though, ZonedDateTime doesn't have such a shortcut function
            java.time.ZonedDateTime (.plus ^java.time.ZonedDateTime date ^long milliseconds java.time.temporal.ChronoUnit/MILLIS))
     :cljs (js/Date. (+ (.getTime date) milliseconds))))

(def duration-units [{:unit "d" :seconds 86400}
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

(defn logout
  [& [event]]
  ; NotifyUI.add('Deleted administrator token')
  ; $state.go('.', {}, {reload: true})
  ; https://google.github.io/closure-library/api/goog.net.Cookies.html
  #?(:clj nil
     :cljs (.remove goog.net.cookies "administrator_token" "/")))
