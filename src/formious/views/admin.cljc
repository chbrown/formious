(ns formious.views.admin
  (:require [rum.core :as rum]
            [formious.common :refer [logout]]))

; (defn- login
;   [email password]
;   (js/fetch "/login" {:email email :password password})
;   .then(function(res) {$state.go($state.params.to) return res.data.message},
;         function(res) {return res.data.message}))
; NotifyUI.addPromise(promise)

(rum/defc Login
  []
  [:div
   [:div.shadow {:style {:width "200px"
                        :margin "80px auto"
                        :backgroundColor "white"}}
    [:form {:ng-submit "login(email, password)"
            :style {:padding "10px"}}
     [:h3 "Admin Login"]
     [:label
      [:div "Email"]
      [:input {:ng-model "email"
               :style {:width "100%"}}]]
     [:label
      [:div "Password"]
      [:input {:ng-model "password"
               :type "password"
               :style {:width "100%"}}]]
     [:p
      [:button "Login"]]]]])

(rum/defc Link
  [to text]
  [:a {:href to} text])

(rum/defc NavLink
  [to]
  (Link to {:activeClassName "current"}))

(rum/defc AppLayout
  [children]
  [:div
   [:nav.fixedflow
    [:NavLink {:to "/admin/aws_accounts"} "AWS Accounts"]
    [:NavLink {:to "/admin/mturk"} "MTurk"]
    [:NavLink {:to "/admin/administrators"} "Administrators"]
    [:NavLink {:to "/admin/experiments"} "Experiments"]
    [:NavLink {:to "/admin/templates"} "Templates"]
    [:NavLink {:to "/admin/responses"} "Responses"]
    [:div {:style "float: right"}
     [:button.anchor.tab {:on-click logout} "Logout"]]]
   children])

(defn elide
  [s n]
  (str (subs s n) (when (> (count s) n) "...")))

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
       [:span.summary {:style "opacity: 0.5"} summary])]))

(rum/defcs TemplateSelect
  [state]
  ; componentDidMount() {
  ;   fetch('/api/templates/').then(templates => {
  ;     this.setState({templates});
  ;   });
  ; }
  [:select
    (for [template (:templates state)]
      [:option {:value (:id template)} (:name template)])])

(rum/defcs TemplateLink
  [state id]
  ; componentDidMount() {
  ;   const {id} = this.props;
  ;   fetch(`/api/templates/${id}`).then(template => {
  ;     this.setState({template});
  ;   });
  ; }
  (Link (str "/admin/templates/edit/" id) (:name (:template state))))

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
              (ObjectDisplay value))])
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
      [:span.string (str object)])))
