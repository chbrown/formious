(ns formious.admin.app
  (:require [rum.core :as rum]))

(rum/defc Login
  []
  [:div
   [:div {:style {:width "200px"
                  :margin "80px auto"
                  :backgroundColor "white"}
          :className "shadow"}
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

(rum/defc AppLayout
  []
  [:div
   [:nav {:fixedflow true}
    [:NavLink {:to "/admin/aws_accounts"} "AWS Accounts"]
    [:NavLink {:to "/admin/mturk"} "MTurk"]
    [:NavLink {:to "/admin/administrators"} "Administrators"]
    [:NavLink {:to "/admin/experiments"} "Experiments"]
    [:NavLink {:to "/admin/templates"} "Templates"]
    [:NavLink {:to "/admin/responses"} "Responses"]
    [:div {:style "float: right"}
     [:button {:ng-click "logout($event)"
               :className "anchor tab"} "Logout"]]] children])

(rum/defc Help
  []
  ; <span className="help">This is a long but very useful help message but most often you
  ; probably won't want to read all of it because it's actually easy to remember and not
  ; all that helpful. Good for reference though.</span>
  ; This message will be truncated to the first 50 characters (TODO: make that configurable).
    ; scope.expanded = false;
    ; // var content = el.text().trim();
    ; var content = full_el.text().trim();
    ; var summary = content.slice(0, 50) + ((content.length > 50) ? '...' : '');
    ; summary_el.text(summary);
  [:span {:className "help"}
   [:span {:className "summary"
           :style "opacity: 0.5"
           :ng-hide "expanded"
           :ng-click "expanded = true"}]
   [:span {:className "full"
           :ng-show "expanded"
           :ng-click "expanded = false"
           :ng-transclude NULL}]])

