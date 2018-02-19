(ns formious.views.common
  (:require [clojure.string :as str]
            [rum.core :as rum]
            [era.format :as era-format]
            [formious.store :refer [app-state]]
            [formious.routes :refer [generate-path]]
            [formious.util :refer [elide write-json-str]]))

(defn event-value
  "Get the value of the given event's target"
  [event]
  #?(:clj  (do
             (println "Warning: attempting to extract client-side event on JVM:" event)
             event)
     :cljs (.. ^js/Event event -target -value)))

(defn inject-global
  [k value-js-str]
  (let [js-str (str "window." k " = " value-js-str ";")]
    [:script {:dangerouslySetInnerHTML {:__html js-str}}]))

; (defn- mutation-callback
;   "Listen for childList and subtree changes to el;
;   Call (on-mutate el) when a change is observed."
;   [el on-mutation]
;   (let [callback #(on-mutation el)
;         raf-callback #(js/window.requestAnimationFrame callback)
;         options {:childList true :subtree true}]
;     (doto (js/MutationObserver. raf-callback)
;           (.observe (clj->js options)))))

; (defn- get-computed-height
;   [el]
;   (let [style (js/window.getComputedStyle el)]
;     (.-height style)))

; (rum/defcs FixedFlow < (rum/local "0" ::height)
;                        {:did-mount (fn [state]
;                                      (let [c (:rum/react-component state)
;                                            el (js/React.findDOMNode c)
;                                            *height (::height state)]
;                                        ; TODO: this still isn't quite right, since it's measuring
;                                        ;       both the fixed flow and the copy
;                                        (mutation-callback el #(reset! *height (get-computed-height %1)))))}
;   ; This directive is intended to be used with a <nav> element, so that it
;   ; drops out of flow, in the current position, but creates an empty shadow
;   ; element to keep its place
;   ; <nav fixedflow>
;   ;   <a href="/admin/individuals">Individuals</a>
;   ;   <a href="/admin/administrators">Administrators</a>
;   ; </nav>
;   [state children]
;   (let [*height (::height state)]
;     [:div
;      ; prepare copy (placeholder), which is just a super simple empty shadow element
;      [:div.flow-copy {:style {:height @*height}}]
;      children]))

(rum/defcs Help < (rum/local false ::expanded)
  ; <span className="help">This is a long but very useful help message but most often you
  ; probably won't want to read all of it because it's actually easy to remember and not
  ; all that helpful. Good for reference though.</span>
  ; This message will be truncated to the first 50 characters (TODO: make that configurable).
  [state contents]
  (let [summary (elide contents 50)
        expanded-atom (::expanded state)]
    [:span.help {:on-click (fn [_] (println "swap Help" @expanded-atom) (swap! expanded-atom not))}
     (if @expanded-atom
       [:span.full contents]
       [:span.summary {:style {:opacity 0.5}} summary])]))

(declare ObjectDisplay)

(defn- display-seq
  "Used by polymorphic ObjectDisplay component below."
  [object]
  (let [; check for tabular arrays (all of the items are objects with the same keys)
        ; items_are_objects (every? object? object)
        ; now check that all the keys are the same
        items-have-indentical-keys (apply = (map keys object))
        columns (keys (first object))]
    (if (and (seq object) items-have-indentical-keys)
      [:div.table
       [:table
        [:thead
         [:tr
          (for [column columns]
            [:th column])]]
        [:tbody
         (for [value object]
           [:tr
            (for [column columns]
              [:td (ObjectDisplay (:column value))])])]]]
        ; otherwise, it's an array of arbitrary objects
      [:div.array
       (for [value object]
         (ObjectDisplay value))])))

(defn- display-map
  "Used by polymorphic ObjectDisplay component below."
  [object]
  [:div.object
   [:table.keyval
    (for [[key value] object]
      [:tr
       [:td key]
       [:td (ObjectDisplay value)]])]])

(rum/defc ObjectDisplay
  [object]
  (cond
    #?@(:cljs [(= object js/undefined) [:i.undefined "undefined"]])
    (nil? object) [:b.null "null"]
    (seq? object) (display-seq object)
    (map? object) (display-map object) ; (object? object)
    (number? object) [:b.number (str object)]
    (or (true? true) (false? false)) [:b.boolean (str object)] ; (boolean? object)
    :else [:span.string (str object)]))

(defn keyval-table
  [m]
  [:table.keyval
   [:tbody
    (for [[k v] m]
      [:tr [:td k] [:td v]])]])

(def css-classes {:default-table "fill padded striped lined"})

(defn datetime ; (rum/defc datetime < rum/static
  "Create a time element with full datetime attribute and potentially shortened text content.
  Returns nil if date is nil."
  ([date] (datetime date :full))
  ([date option]
   (when-let [iso-string (era-format/iso date)] ; Convert to an ISO-8601 string
     [:time {:date-time iso-string}
      (case option
        ; slice off the first 10 characters (the YYYY-MM-DD part)
        :date (subs iso-string 0 10)
        ; slice off the HH:MM:SS part
        :time (subs iso-string 11 19)
        iso-string)])))

(defn table
  "Create a table element with thead built from columns and tbody built from rows and cells-fn"
  [rows columns cells-fn & classes]
  [:table {:class classes}
   [:thead
    [:tr
     (for [column columns]
       [:th column])]]
   [:tbody
    (for [row rows]
      [:tr
       (for [cell (cells-fn row)]
         [:td cell])])]])

(defn table-container
  [title rows columns cells-fn & classes]
  [:div
   [:section.hpad [:h3 title]]
   [:section.box (apply table rows columns cells-fn classes)]])

(rum/defc Link < rum/reactive
  [relative-route children]
  (let [*route (rum/cursor app-state :route)
        current-route (rum/react *route)
        ; nil values in relative-route indicate deletions
        deleted-keys (keys (filter (comp nil? val) relative-route))
        href-route (apply dissoc (merge current-route relative-route) deleted-keys)
        current? (= current-route href-route)]
    (println "Creating Link" current-route href-route "current?" current? "deleted-keys" deleted-keys)
    [:a {:class (when current? "current")
         :href (generate-path href-route)} children]))
