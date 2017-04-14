(ns formious.admin.pages.access-tokens
  (:require [rum.core :as rum]))

; function formatDate(date) {
;   return date.toString();
; }

; $scope.access_tokens = AccessToken.query();
; $scope.delete = function(index) {
;   var promise = $scope.access_tokens[index].$delete().then(function() {
;     $scope.access_tokens.splice(index, 1);
;     return 'Deleted';
;   });
;   NotifyUI.addPromise(promise);
; };
(rum/defc AccessTokensTable
  [access_tokens]
  [:div
   [:section {:className "hpad"} [:h3 "Access Tokens"]]
   [:section {:className "box"}
    [:table {:className "striped lined padded fill"}
     [:thead
      [:tr
       [:th "ID"]
       [:th "Token"]
       [:th "Relation / Foreign ID"]
       [:th "Expires"]
       [:th "Redacted"]
       [:th "Created"]
       [:th]]]
     [:tbody
      (for [access_token access_tokens]
        [:tr
         [:td {:title (:id access_token)}
          [:a {:ui-sref "admin.access_tokens.edit({access_token_id: access_token.id})"} (:id access_token)]]
         [:td (:token access_token)]
         [:td
          [:a {:href (str "/admin/" (:relation access_token) "/" (:foreign_id access_token) "")}
           (:relation access_token) "/" (:foreign_id access_token)]]
         [:td [:time {:datetime-format "yyyy-MM-dd"} (:expires access_token)]]
         [:td [:time {:datetime-format "yyyy-MM-dd"} (:redacted access_token)]]
         [:td [:time {:datetime-format "yyyy-MM-dd"} (:created access_token)]]
         [:td [:button {:ng-click "delete($index)"} "Delete"]]])]]]])

(rum/defc AccessTokensLayout
  []
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:a {:ui-sref "admin.access_tokens.table"
         :ui-sref-active "current"
         :className "tab"} "List access tokens"]
    [:a {:ui-sref "admin.access_tokens.edit({access_token_id: 'new'})"
         :ui-sref-active "current"
         :className "tab"} "New access token"]]
   children])

; $scope.access_token = AccessToken.get({id: $state.params.access_token_id});
(rum/defc AccessTokensEdit
  [access_token]
  [:form {:ng-submit "sync($event)"
          :className "hpad"}
   [:label {:className "block"}
    [:div [:b "Token"]]
    [:input {:type "text"
             :ng-model "access_token.token"
             :style "width: 100%;"}]]
   [:label {:className "block"}
    [:div [:b "Relation"]]
    [:input {:type "text"
             :ng-model "access_token.relation"
             :style "width: 100%;"}]]
   [:label {:className "block"}
    [:div [:b "Foreign ID"]]
    [:input {:type "text"
             :ng-model "access_token.foreign_id"
             :style "width: 100%;"}]]
   [:label {:className "block"}
    [:div [:b "Expires"]]
    [:time (formatDate (:expires access_token))]]
   [:label {:className "block"}
    [:div [:b "Redacted"]]
    [:time (formatDate (:redacted access_token))]]
   [:label {:className "block"}
    [:div [:b "Created"]]
    [:time (formatDate (:created access_token))]]
   [:div {:className "block"} [:button "Save"]]])
