(ns formious.views.hits
  (:require [rum.core :as rum]
            [formious.common :refer [path-for]]
            [formious.views.common :refer [css-classes datetime keyval-table]]))

(def $storage {:todo "Pull this from global state"})

(rum/defc MTurkHITsTable
  [hits]
  [:div
   [:section.hpad
    [:h3 "HITs"]
    [:a {:href (path-for :admin-mturk-hits :id "new")} "Create new HIT"]]
   (when (empty? hits) [:section.hpad [:p "No HITs could be found."]])
   (for [hit hits]
     [:section.hpad.box
      [:h3 [:a {:href (path-for :admin-mturk-hit :HITId (:HITId hit))} (:Title hit)]]
      (keyval-table hit)])])

(rum/defc MTurkHITsNew
  [preview_url]
  [:div
   [:section.hpad
    [:h3 "Operation:"
     [:select {:ng-model (:Operation $storage)}
      [:option {:value "CreateHIT"} "Create HIT"]
      [:option {:value "RegisterHITType"} "Register HIT Type"]]]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:h3 "Common parameters"]
     [:label.block
      [:div
       [:b "Title"]
       [:span {:class "help"}
        "The title of the HIT. A title should be short and describe the kind of task the HIT contains"]]
      [:input {:type "text"
               :ng-model (:Title $storage)
               :style {:width "500px"}}]]
     [:label.block
      [:div [:b "Description"] [:span {:class "help"} "2000 character max"]]
      [:textarea {:ng-model (:Description $storage)
                  :rows "2"
                  :style {:width "500px"}}]]
     [:label.block
      [:div
       [:b "Reward"]
       [:span {:class "help"}
        "The amount of money (in USD) the Requester will pay a Worker for successfully completing the HIT"]]
      [:input {:type "text"
               :ng-model (:Reward $storage)}]]
     [:label.block
      [:div
       [:b "Keywords"]
       [:span {:class "help"}
        "One or more words or phrases that describe the HIT, separated by commas"]]
      [:input {:type "text"
               :ng-model (:Keywords $storage)
               :style {:width "500px"}}]]
     [:label.block
      [:div
       [:b "Assignment Duration (e.g., 3h)"]
       [:span {:class "help"}
        "The amount of time that a Worker has to complete the HIT after accepting it"]]
      [:input {:type "text"
               :ng-model (:AssignmentDurationInSeconds $storage)
               :duration-string true}]]
     [:label.block
      [:div
       [:b "Auto-approval Delay (e.g., 60m)"]
       [:span {:class "help"}
        "The amount of time after a HIT has been submitted before the assignment is automatically approved"]]
      [:input {:type "text"
               :ng-model (:AutoApprovalDelayInSeconds $storage)
               :duration-string true}]]
     [:label.block
      [:div
       [:b "Other settings"]
       [:span {:class "help"}
        "JSON representation of any other settings to send. This is an object that will be merged with the rest of the payload. E.g., to require Master's qualification in production, use this: "
        [:code
         [:pre
          {"QualificationRequirement" {"QualificationTypeId" "2F1QJWKUDD8XADTFD2Q0G6UTO95ALH"
                                       "Comparator" "Exists"}}]]]]
      [:textarea.code {:json-transform true
                       :enhance true
                       :ng-model (:extra $storage)
                       :style {:width "500px" :min-height "50px"}}]]
     (when (= (:Operation $storage) "CreateHIT")
       [:div
        [:h3 "HIT parameters"]
        [:label.block
         [:div
          [:b "Max Assignments"]
          [:span {:class "help"}
           "The number of times the HIT can be accepted (by different users) and completed before the HIT becomes unavailable. A single user will only be able to complete the HIT once."]]
         [:input {:type "number"
                  :ng-model (:MaxAssignments $storage)}]]
        [:label.block
         [:div
          [:b "Lifetime (e.g., 3d)"]
          [:span {:class "help"}
           "The amount of time that a HIT can be accepted; after the lifetime expires, the HIT no longer appears in searches"]]
         [:input {:type "text"
                  :ng-model (:LifetimeInSeconds $storage)
                  :duration-string true}]]
        [:h3 "HIT " [:code "Question"] " parameters"]
        [:label.block
         [:div
          [:b "External URL"]
          [:span {:class "help"}
           "The URL of your web form, to be displayed in a frame in the Worker's web browser. It can have a querystring; Mechanical Turk parses the url and adds new querystring parameters as needed."]]
         [:input {:type "text"
                  :ng-model (:ExternalURL $storage)
                  :style {:width "500px"}}]]
        [:label.block
         [:div
          [:b "Frame Height (integer)"]
          [:span {:class "help"} "The height of the frame, in pixels"]]
         [:input {:type "number"
                  :ng-model (:FrameHeight $storage)}]]])
     [:div.block [:button "Submit"]]]]
   [:section.hpad
    [:h3
     [:label "Preview " [:input {:type "checkbox"
                                 :ng-model (:preview_iframe $storage)}]]]]
   (when (and (:preview_iframe $storage) preview_url)
     [:div
      [:pre.hpad preview_url]
      [:section.box
       [:iframe {:src preview_url
                 :scrolling "auto"
                 :frameborder "0"
                 :align "center"
                 :width "100%"
                 :height (str (:FrameHeight $storage) "px")}]]])])

(rum/defc MTurkHITsEdit
  [hit assignments bonus_payments $storage]
  [:div
   [:section.hpad [:h3 "HIT: " (:Title hit)]]
   [:section.hpad.box
    (keyval-table hit)]
   [:section.hpad.box
    [:h3 "ExtendHIT"]
    [:span {:class "help"}
     "Extend the duration of this HIT or add assignments to it."]
    [:form {:ng-submit "ExtendHIT($event)"}
     [:label
      [:div
       [:b "Max Assignments Increment"]
       [:span {:class "help"}
        "The number of assignments by which to increment the MaxAssignments parameter of the HIT."]]
      [:input {:type "text"
               :ng-model "extension.MaxAssignmentsIncrement"}]]
     [:label
      [:div
       [:b "Expiration Increment (e.g., 24h)"]
       [:span {:class "help"}
        "The amount of time, in seconds, by which to extend the expiration date. If the HIT has not yet expired, this amount is added to the HIT's expiration date. If the HIT has expired, the new expiration date is the current time plus this value."]]
      [:input {:type "text"
               :ng-model "extension.ExpirationIncrement"}]]
     [:p [:button "ExtendHIT"]]]]
   [:section.hpad.box
    [:h3 "Import"]
    [:span {:class "help"}
     "Import data that was submitted to Mechanical Turk directly into the local database."
     [:br]
     "Because each Assignment has a unique identifier (the AssignmentId field), duplicate imports will be ignored."]
    [:p [:form {:ng-submit "import($event)"} [:p [:button "Import"]]]]]
   [:section.hpad.box
    [:h3 "Assign Qualifications"]
    [:p
     "Assign qualification to all "
     (:length assignments)
     " workers that completed this HIT."]
    [:form {:ng-submit "assignQualifications($event)"}
     [:label
      [:div [:b "Qualification Type"]]
      [:select {:ng-model (-> $storage :AssignQualification :QualificationTypeId)
                :ng-options "QualificationType.QualificationTypeId as QualificationType.Name for QualificationType in QualificationTypes"}
       [:option {:value ""} "-- Qualification Type --"]]]
     [:label
      [:div [:b "Value"]]
      [:input {:type "number"
               :ng-model (-> $storage :AssignQualification :IntegerValue)}]]
     [:label
      [:div
       [:input {:type "checkbox"
                :ng-model (-> $storage :AssignQualification :SendNotification)}]
       [:b "Send Notification"]]]
     [:div [:button "Assign Qualifications"]]]]
   [:section.hpad.box
    [:h3 "Export"]
    [:div
     [:a {:href "{hit.HITId}.csv"} "HIT_" (:HITId hit) ".csv"]
     "· "
     [:a {:href "{hit.HITId}.csv?view"} "View"]]
    [:div
     [:a {:href "{hit.HITId}.tsv"} "HIT_" (:HITId hit) ".tsv"]
     "· "
     [:a {:href "{hit.HITId}.tsv?view"} "View"]]]
   [:section.hpad.box
    [:h3 "Bonuses"]
    [:table
     [:thead
      [:tr [:th "WorkerId"] [:th "BonusAmount"] [:th "Reason"] [:th "GrantTime"]]]
     [:tbody
      (for [bonus_payment bonus_payments]
        [:tr
         [:td (:WorkerId bonus_payment)]
         [:td (:FormattedPrice (:BonusAmount bonus_payment))]
         [:td (:Reason bonus_payment)]
         [:td (:GrantTime bonus_payment)]])]]]
   [:section.hpad
    [:h3 "Assignments"]
    [:label
     "Show "
     [:input {:ng-model (:assignments_limit $storage)
              :type "number"}]
     " out of "
     (:length assignments)]
    [:label
     [:input {:ng-model (:assignments_show_times $storage)
              :type "checkbox"}]
     [:b "Show times"]]
    [:label
     [:input {:ng-model (:assignments_show_bonus $storage)
              :type "checkbox"}]
     [:b "Show bonus"]]
    [:label
     [:input {:ng-model (:assignments_show_answer $storage)
              :type "checkbox"}]
     [:b "Show answer"]]
    [:label
     [:input {:ng-model (:assignments_show_block $storage)
              :type "checkbox"}]
     [:b "Show 'Block worker'"]]
    [:label
     [:div
      [:b "Responses Summarizer"]
      [:span {:class "help"}
       "A Javascript function from an Array of responses to a serializable object summarizing the responses."]]
     [:div.code "function(responses, assignment) " "{"]
     [:div.code {:style {:margin-left "1em"}}
      [:textarea.code {:enhance true
                       :ng-model (:responses_summarizer $storage)
                       :style {:width "100%" :min-height "100px"}}]]
     [:div.code "}"]]]
   (for [assignment (take (:assignments_limit $storage) assignments)]
     [:section.box
      [:div {:assignment assignment}]])])
