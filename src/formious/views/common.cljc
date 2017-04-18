(ns formious.views.common
  (:require [clojure.string :as str]
            [rum.core :as rum]
            [formious.common :refer [path-for elide ->iso logout]]))

(defn event-value
  "Get the value of the given event's target (element)"
  [event]
  #?(:clj event
     :cljs (.. ^js/Event event -target -value)))

(rum/defc not-found
  [path]
  [:div
   [:h3 "Not Found!"]
   [:p "Could not find route for path:"]
   [:code.hpad path]
   [:p
    [:a {:href "javascript:back"} "back"]]])

(rum/defc admin-layout
  [children]
  [:html
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "Formious Admin"]
    [:link {:href "/favicon.png" :rel "icon" :type "image/png"}]
    [:link {:href "/build/site.css" :rel "stylesheet" :type "text/css"}]]
   [:body.admin
    [:div {:id "app"} children]
    [:script {:src "/build/bundle.js"}]]])

(rum/defc block-layout
  [context-json-str header html]
  [:html
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "title>Experimental Interface"]
    [:link {:href "data:;base64,=" :rel "icon" :type "image/x-icon"}]
    [:script {:src "//cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js"}]
    [:script {:src "/public/formious-globals.js"}]
    [:script {:dangerouslySetInnerHTML {:__html (str "formious.context = " context-json-str ";")}}]]
   [:body
    {:dangerouslySetInnerHTML {:__html (str header \newline html)}}]])

(rum/defc AppLayout
  [children]
  [:div
   [:nav.fixedflow
    [:a {:href (path-for :admin-aws-accounts)} "AWS Accounts"]
    [:a {:href (path-for :admin-mturk)} "MTurk"]
    [:a {:href (path-for :admin-administrators)} "Administrators"]
    [:a {:href (path-for :admin-experiments)} "Experiments"]
    [:a {:href (path-for :admin-templates)} "Templates"]
    [:a {:href (path-for :admin-responses)} "Responses"]
    [:div {:style {:float "right"}}
     [:button.anchor.tab {:on-click logout} "Logout"]]]
   children])

(rum/defcs Help < (rum/local false ::expanded)
  ; <span className="help">This is a long but very useful help message but most often you
  ; probably won't want to read all of it because it's actually easy to remember and not
  ; all that helpful. Good for reference though.</span>
  ; This message will be truncated to the first 50 characters (TODO: make that configurable).
  [state contents]
  (let [summary (elide contents 50)
        expanded-atom (::expanded state)]
    [:span.help {:on-click (fn [_] (swap! expanded-atom not))}
     (if @expanded-atom
       [:span.full contents]
       [:span.summary {:style {:opacity 0.5}} summary])]))

(rum/defc ObjectDisplay
  [object]
  (cond
    ; (= object js/undefined)
    ;   [:i.undefined "undefined"]
    (nil? object)
      [:b.null "null"]
    (seq? object)
      (let [; check for tabular arrays (all of the items are objects with the same keys)
            ; items_are_objects (every? object? object)
            ; now check that all the keys are the same
            items_have_indentical_keys (apply = (map keys object))
            columns (keys (first object))]
        (if (and (seq object) items_have_indentical_keys)
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
             (ObjectDisplay value))]))
    (map? object) ; object?
      [:div.object
       [:table.keyval
        (for [[key value] object]
          [:tr
           [:td key]
           [:td (ObjectDisplay value)]])]]
    (number? object)
      [:b.number (str object)]
    (or (= object true) (= object false)) ; (boolean? object)
      [:b.boolean (str object)]
    :else
      [:span.string (str object)]))

(defn- login
  [email password]
  ; (js/fetch "/login" {:email email :password password})
  ; .then(function(res) {$state.go($state.params.to) return res.data.message},
  ;       function(res) {return res.data.message}))
  ; NotifyUI.addPromise(promise)
  (println "TODO: actually login" email password))

(rum/defcs admin-login < (rum/local 0 ::email)
                         (rum/local 0 ::password)
  [state]
  [:div
   [:div.shadow {:style {:width "200px"
                         :margin "80px auto"
                         :background-color "white"}}
    [:form {:on-submit (fn [_] (login @(::email state) @(::password state)))
            :style {:padding "10px"}}
     [:h3 "Admin Login"]
     [:label
      [:div "Email"]
      [:input {:on-change #(swap! (::email state) (event-value %))
               :style {:width "100%"}}]]
     [:label
      [:div "Password"]
      [:input {:ng-model #(swap! (::password state) (event-value %))
               :type "password"
               :style {:width "100%"}}]]
     [:p
      [:button "Login"]]]]])

(defn keyval-table
  [m]
  [:table.keyval
   [:tbody
    (for [[k v] m]
      [:tr [:td k] [:td v]])]])

(def css-classes {:default-table "fill padded striped lined"})

; (rum/defc datetime < rum/static
(defn datetime
  "Create a <time> element with full datetime attribute and potentially shortened text content.
  Returns nil if date is nil."
  [date & [option]]
  (when-let [iso-string (some-> date ->iso)] ; Convert to an ISO-8601 string
    [:time {:dateTime iso-string}
     (case option
       ; slice off the first 10 characters (the YYYY-MM-DD part)
       :date (subs iso-string 0 10)
       ; slice off the HH:MM:SS part
       :time (subs iso-string 11 19)
       iso-string)]))

(defn table
  "Create a <table> element with thead built from columns and tbody built from rows and cells-fn"
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
