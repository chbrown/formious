(ns formious.admin.pages.hits
  (:require [rum.core :as rum]))

(defn keyval-table
  [m]
  [:table {:className "keyval"}
   [:tbody
    (for [[k v] m]
      [:tr [:td k] [:td v]])]])

(rum/defc MTurkHITsTable
  [hits]
  [:div
   [:section {:className "hpad"}
    [:h3 "HITs"]
    [:a {:ui-sref "admin.mturk.hits.new"} "Create new HIT"]]
   [:section {:ng-if "hits.length === 0"
              :className "hpad"}
    [:p "No HITs could be found."]]
   (for [hit hits]
     [:section {:className "box hpad"}
      [:h3 [:a {:ui-sref "admin.mturk.hits.edit({HITId: hit.HITId})"} (:Title hit)]]
      (keyval-table hit)])])

(rum/defc MTurkHITsNew
  []
  [:div
   [:section {:className "hpad"}
    [:h3
     "Operation:"
     [:select {:ng-model "$storage.Operation"}
      [:option {:value "CreateHIT"} "Create HIT"]
      [:option {:value "RegisterHITType"} "Register HIT Type"]]]]
   [:section {:className "box hpad"}
    [:form {:ng-submit "sync($event)"}
     [:h3 "Common parameters"]
     [:label {:className "block"}
      [:div
       [:b "Title"]
       [:span {:className "help"}
        "The title of the HIT. A title should be short and describe the kind of task the HIT contains"]]
      [:input {:type "text"
               :ng-model "$storage.Title"
               :style "width: 500px"}]]
     [:label {:className "block"}
      [:div [:b "Description"] [:span {:className "help"} "2000 character max"]]
      [:textarea {:ng-model "$storage.Description"
                  :rows "2"
                  :style "width: 500px"}]]
     [:label {:className "block"}
      [:div
       [:b "Reward"]
       [:span {:className "help"}
        "The amount of money (in USD) the Requester will pay a Worker for successfully completing the HIT"]]
      [:input {:type "text"
               :ng-model "$storage.Reward"}]]
     [:label {:className "block"}
      [:div
       [:b "Keywords"]
       [:span {:className "help"}
        "One or more words or phrases that describe the HIT, separated by commas"]]
      [:input {:type "text"
               :ng-model "$storage.Keywords"
               :style "width: 500px"}]]
     [:label {:className "block"}
      [:div
       [:b "Assignment Duration (e.g., 3h)"]
       [:span {:className "help"}
        "The amount of time that a Worker has to complete the HIT after accepting it"]]
      [:input {:type "text"
               :ng-model "$storage.AssignmentDurationInSeconds"
               :duration-string true}]]
     [:label {:className "block"}
      [:div
       [:b "Auto-approval Delay (e.g., 60m)"]
       [:span {:className "help"}
        "The amount of time after a HIT has been submitted before the assignment is automatically approved"]]
      [:input {:type "text"
               :ng-model "$storage.AutoApprovalDelayInSeconds"
               :duration-string true}]]
     [:label {:className "block"}
      [:div
       [:b "Other settings"]
       [:span {:className "help"}
        "JSON representation of any other settings to send. This is an object that will be merged with the rest of the payload. E.g., to require Master's qualification in production, use this: "
        [:code
         [:pre
          {"QualificationRequirement" {"QualificationTypeId" "2F1QJWKUDD8XADTFD2Q0G6UTO95ALH"
                                       "Comparator" "Exists"}}]]]]
      [:textarea {:json-transform true
                  :enhance true
                  :ng-model "$storage.extra"
                  :className "code"
                  :style "width: 500px; min-height: 50px;"}]]
     [:p]
     [:div {:ng-show "$storage.Operation == 'CreateHIT'"}
      [:h3 "HIT parameters"]
      [:label {:className "block"}
       [:div
        [:b "Max Assignments"]
        [:span {:className "help"}
         "The number of times the HIT can be accepted (by different users) and completed before the HIT becomes unavailable. A single user will only be able to complete the HIT once."]]
       [:input {:type "number"
                :ng-model "$storage.MaxAssignments"}]]
      [:label {:className "block"}
       [:div
        [:b "Lifetime (e.g., 3d)"]
        [:span {:className "help"}
         "The amount of time that a HIT can be accepted; after the lifetime expires, the HIT no longer appears in searches"]]
       [:input {:type "text"
                :ng-model "$storage.LifetimeInSeconds"
                :duration-string true}]]
      [:h3 "HIT " [:code "Question"] " parameters"]
      [:label {:className "block"}
       [:div
        [:b "External URL"]
        [:span {:className "help"}
         "The URL of your web form, to be displayed in a frame in the Worker's web browser. It can have a querystring; Mechanical Turk parses the url and adds new querystring parameters as needed."]]
       [:input {:type "text"
                :ng-model "$storage.ExternalURL"
                :style "width: 500px"}]]
      [:label {:className "block"
               :ng-show "$storage.Operation == 'CreateHIT'"}
       [:div
        [:b "Frame Height (integer)"]
        [:span {:className "help"} "The height of the frame, in pixels"]]
       [:input {:type "number"
                :ng-model "$storage.FrameHeight"}]]]
     [:div {:className "block"} [:button "Submit"]]]]
   [:section {:className "hpad"}
    [:h3
     [:label "Preview " [:input {:type "checkbox"
                                 :ng-model "$storage.preview_iframe"}]]]]
   [:div {:ng-if "$storage.preview_iframe && preview_url"}
    [:pre {:className "hpad"} preview_url]
    [:section {:className "box"}
     [:iframe {:src "{preview_url}"
               :scrolling "auto"
               :frameborder "0"
               :align "center"
               :width "100%"
               :height "{$storage.FrameHeight}"}]]]])

(rum/defc MTurkHITsEdit
  [hit]
  [:div
   [:section {:className "hpad"} [:h3 "HIT: " (:Title hit)]]
   [:section {:className "box hpad"}
    (keyval-table hit)]
   [:section {:className "box hpad"}
    [:h3 "ExtendHIT"]
    [:span {:className "help"}
     "Extend the duration of this HIT or add assignments to it."]
    [:form {:ng-submit "ExtendHIT($event)"}
     [:label
      [:div
       [:b "Max Assignments Increment"]
       [:span {:className "help"}
        "The number of assignments by which to increment the MaxAssignments parameter of the HIT."]]
      [:input {:type "text"
               :ng-model "extension.MaxAssignmentsIncrement"}]]
     [:label
      [:div
       [:b "Expiration Increment (e.g., 24h)"]
       [:span {:className "help"}
        "The amount of time, in seconds, by which to extend the expiration date. If the HIT has not yet expired, this amount is added to the HIT's expiration date. If the HIT has expired, the new expiration date is the current time plus this value."]]
      [:input {:type "text"
               :ng-model "extension.ExpirationIncrement"}]]
     [:p [:button "ExtendHIT"]]]]
   [:section {:className "box hpad"}
    [:h3 "Import"]
    [:span {:className "help"}
     "Import data that was submitted to Mechanical Turk directly into the local database."
     [:br]
     "\n            Because each Assignment has a unique identifier (the AssignmentId field), duplicate imports will be ignored."]
    [:p [:form {:ng-submit "import($event)"} [:p [:button "Import"]]]]]
   [:section {:className "box hpad"}
    [:h3 "Assign Qualifications"]
    [:p
     "Assign qualification to all "
     (:length assignments)
     " workers that completed this HIT."]
    [:form {:ng-submit "assignQualifications($event)"}
     [:label
      [:div [:b "Qualification Type"]]
      [:select {:ng-model "$storage.AssignQualification.QualificationTypeId"
                :ng-options "QualificationType.QualificationTypeId as QualificationType.Name for QualificationType in QualificationTypes"}
       [:option {:value ""} "-- Qualification Type --"]]]
     [:label
      [:div [:b "Value"]]
      [:input {:type "number"
               :ng-model "$storage.AssignQualification.IntegerValue"}]]
     [:label
      [:div
       [:input {:type "checkbox"
                :ng-model "$storage.AssignQualification.SendNotification"}]
       [:b "Send Notification"]]]
     [:div [:button "Assign Qualifications"]]]]
   [:section {:className "box hpad"}
    [:h3 "Export"]
    [:div
     [:a {:href "{hit.HITId}.csv"} "HIT_" (:HITId hit) ".csv"]
     "\n            · "
     [:a {:href "{hit.HITId}.csv?view"} "View"]]
    [:div
     [:a {:href "{hit.HITId}.tsv"} "HIT_" (:HITId hit) ".tsv"]
     "\n            · "
     [:a {:href "{hit.HITId}.tsv?view"} "View"]]]
   [:section {:className "box hpad"}
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
   [:section {:className "hpad"}
    [:h3 "Assignments"]
    [:label
     "Show "
     [:input {:ng-model "$storage.assignments_limit"
              :type "number"}]
     " out of "
     (:length assignments)]
    [:label
     [:input {:ng-model "$storage.assignments_show_times"
              :type "checkbox"}]
     [:b "Show times"]]
    [:label
     [:input {:ng-model "$storage.assignments_show_bonus"
              :type "checkbox"}]
     [:b "Show bonus"]]
    [:label
     [:input {:ng-model "$storage.assignments_show_answer"
              :type "checkbox"}]
     [:b "Show answer"]]
    [:label
     [:input {:ng-model "$storage.assignments_show_block"
              :type "checkbox"}]
     [:b "Show 'Block worker'"]]
    [:label
     [:div
      [:b "Responses Summarizer"]
      [:span {:className "help"}
       "A Javascript function from an Array of responses to a serializable object summarizing the responses."]]
     [:div {:className "code"} "function(responses, assignment) " "{"]
     [:div {:className "code"
            :style "margin-left: 1em"}
      [:textarea {:enhance true
                  :ng-model "$storage.responses_summarizer"
                  :className "code"
                  :style "width: 100%; min-height: 100px"}]]
     [:div {:className "code"} "}"]]]
   (for [assignment (take (:assignments_limit $storage) assignments)]
     [:section {:className "box"}
      [:div {:assignment assignment}]])])
