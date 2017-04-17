(ns formious.common
  (:require [bidi.bidi :as bidi]
            [clojure.string :as str]
            #?(:clj [clojure.instant :refer [parse-timestamp]])
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

(defn ->Instant
  [x]
  #?(:clj (condp instance? x
            java.util.Date (.toInstant ^java.util.Date x)
            java.sql.Timestamp (.toInstant ^java.sql.Timestamp x)
            java.time.ZonedDateTime (.toInstant ^java.time.ZonedDateTime x)
            String (parse-timestamp x)
            x)
     :cljs (cond
             (instance? js/Date x) x
             (string? x) (js/Date. x)
             :else x)))

(defn- Instant->iso
  [instant]
  #?(:clj (.toString ^java.time.Instant instant)
     :cljs (.toISOString ^js/Date instant)))

(defn ->iso
  [d & [option]]
  (let [iso-string (-> d ->Instant Instant->iso)]
    (case option
      :date (subs iso-string 0 10)
      :time (subs iso-string 11 19)
      iso-string)))

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
