(ns formious.views.qualification-types
  (:require [rum.core :as rum]))

(rum/defc QualificationTypeTable
  [qualification-types]
  [:div
   [:section.hpad
    [:h3 "Qualification Types"]
    [:a {:ui-sref "admin.mturk.qualification_types.new"}
     "Create new Qualification Type"]]
   [:section.hpad.box
    [:label
     [:div
      [:b "Query"]
      [:span {:class "help"}
       "A text query against all of the searchable attributes of Qualification types."]]
     [:input {:ng-model "SearchQualificationTypes.Query"}]]
    [:label
     [:div
      [:b "SortDirection"]
      [:span {:class "help"}
       "A text query against all of the searchable attributes of Qualification types."]]
     [:select {:ng-model "SearchQualificationTypes.SortDirection"}
      [:option {:value "Ascending"} "Ascending"]
      [:option {:value "Descending"} "Descending"]]]
    [:label
     [:div
      [:b "Page Size"]
      [:span {:class "help"}
       "The number of Qualification types to include in a page of results. The operation divides the complete sorted result set into pages of this many Qualification types."]]
     [:input {:type "number"
              :min "1"
              :max "100"
              :ng-model "SearchQualificationTypes.PageSize"}]]
    [:label
     [:div
      [:b "Page Number"]
      [:span {:class "help"}
       "The page of results to return. After the operation filters, sorts, and divides the Qualification types into pages of size PageSize, it returns page corresponding to PageNumber as the results of the operation."]]
     [:input {:type "number"
              :min "1"
              :ng-model "SearchQualificationTypes.PageNumber"}]]
    [:label
     [:div
      [:input {:type "checkbox"
               :ng-model "SearchQualificationTypes.MustBeRequestable"}]
      [:b "Must Be Requestable"]
      [:span {:class "help"}
       "Specifies that only Qualification types that a user can request through the Amazon Mechanical Turk web site, such as by taking a Qualification test, are returned as results of the search. Some Qualification types, such as those assigned automatically by the system, cannot be requested directly by users. If false, all Qualification types, including those managed by the system, are considered for the search."]]]
    [:label
     [:div
      [:input {:type "checkbox"
               :ng-model "SearchQualificationTypes.MustBeOwnedByCaller"}]
      [:b "Must Be Owned By Caller"]
      [:span {:class "help"}
       "Specifies that only Qualification types that the Requester created are returned. If false, the operation returns all Qualification types."]]]]
   [:section {:ng-if "QualificationTypes.length === 0"
              :class "hpad"}
    [:p "No Qualification Types could be found."]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead
      [:tr
       [:th "QualificationTypeId"]
       [:th "CreationTime"]
       [:th "Name"]
       [:th "Description"]
       [:th "Keywords"]
       [:th "Status"]
       [:th]]]
     [:tbody
      (for [QualificationType qualification-types]
        [:tr
         [:td
          [:a {:ui-sref "admin.mturk.qualification_types.edit({QualificationTypeId: QualificationType.QualificationTypeId})"}
           (:QualificationTypeId QualificationType)]]
         [:td [:DateTime {:date (:CreationTime QualificationType)}]]
         [:td (:Name QualificationType)]
         [:td (:Description QualificationType)]
         [:td (:Keywords QualificationType)]
         [:td (:QualificationTypeStatus QualificationType)]
         [:td [:button {:ng-click "delete(QualificationType)"} "Delete"]]])]]]])

(rum/defc QualificationTypeEdit
  []
  [:div
   [:label {:class "block"
            :ng-hide "QualificationType.QualificationTypeId"}
    [:div
     [:b "Name"]
     [:span {:class "help"}
      "The name of the Qualification type. The type name is used to represent the Qualification to Workers, and to find the type using a Qualification type search."]]
    [:input {:type "text"
             :ng-model "QualificationType.Name"
             :style "width: 500px"}]]
   [:label.block
    [:div
     [:b "Description"]
     [:span {:class "help"}
      "A long description for the Qualification type. On the Amazon Mechanical Turk website, the long description is displayed when a Worker examines a Qualification type. 2000 character maximum."]]

    [:textarea {:ng-model "QualificationType.Description"
                :rows "2"
                :style "width: 500px"}]]
   [:label {:class "block"
            :ng-hide "QualificationType.QualificationTypeId"}
    [:div
     [:b "Keywords"]
     [:span {:class "help"}
      "One or more words or phrases that describe the Qualification type, separated by commas. The keywords of a type make the type easier to find during a search."]]
    [:input {:type "text"
             :ng-model "QualificationType.Keywords"
             :style "width: 500px"}]]
   [:label.block
    [:div
     [:b "Retry Delay (e.g., 60m)"]
     [:span {:class "help"}
      "The amount of time that a Worker must wait after requesting a Qualification of the Qualification type before the worker can retry the Qualification request."]]
    [:input {:type "text"
             :ng-model "QualificationType.RetryDelayInSeconds"
             :duration-string true}]]
   [:label.block
    [:div
     [:b "Status"]
     [:span {:class "help"} "The initial status of the Qualification type."]]
    [:select {:ng-model "QualificationType.QualificationTypeStatus"}

     [:option {:value "Active"} "Active"]
     [:option {:value "Inactive"} "Inactive"]]]
   [:label.block
    [:div
     [:b "Test"]
     [:span {:class "help"}
      "The questions for the Qualification test a Worker must answer correctly to obtain a Qualification of this type, in the form of a QuestionForm data structure. Must not be be specified if "
      [:code "Auto Granted"]
      " is checked."]]
    [:span [:i "Not yet implemented."]]]
   [:label {:class "block"
            :ng-show "QualificationType.Test"}
    [:div
     [:b "Test Duration"]
     [:span {:class "help"}
      "The amount of time the Worker has to complete the Qualification test, starting from the time the Worker requests the Qualification. Required if the Test parameter is specified."]]
    [:input {:type "text"
             :ng-model "QualificationType.TestDuration"}]]
   [:label {:class "block"
            :ng-show "QualificationType.Test"}
    [:div
     [:b "AnswerKey"]
     [:span {:class "help"}
      "The answers to the Qualification test specified in the Test parameter, in the form of an AnswerKey data structure."]]
    [:span [:i "Not yet implemented."]]]
   [:label.block
    [:div
     [:input {:type "checkbox"
              :ng-model "QualificationType.AutoGranted"
              :ng-true-value "1"
              :ng-false-value "0"}]
     [:b "Auto Granted"]
     [:span {:class "help"}
      "Specifies whether requests for the Qualification type are granted immediately, without prompting the Worker with a Qualification test."]]]
   [:label {:class "block"
            :ng-show "QualificationType.AutoGranted"}
    [:div
     [:b "Auto Granted Value"]
     [:span {:class "help"}
      "The Qualification value to use for automatically granted Qualifications."]]
    [:input {:ng-model "QualificationType.AutoGrantedValue"}]]])

(rum/defc QualificationTypeNew
  []
  [:div
   [:section.hpad [:h3 "CreateQualificationType"]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:ng-include {:src "'/ui/admin/mturk/qualification_types/form.html'"}]
     [:div.block [:button "Submit"]]]]])

(rum/defc QualificationTypeOne
  [QualificationType qualifications]
  [:div
   [:section.hpad
    [:h3 "Qualification Type: " (:QualificationTypeId QualificationType)]
    [:h4 "Name: " (:Name QualificationType)]
    [:h4 "Keywords: " (:Keywords QualificationType)]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:ng-include {:src "'/ui/admin/mturk/qualification_types/form.html'"}]
     [:div.block [:button "Submit"]]]]
   [:section.hpad [:h3 "Qualifications"]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead
      [:tr [:th "Subject Id"] [:th "Grant Time"] [:th "Integer Value"] [:th "Status"] [:th]]]
     [:tbody
      (for [Qualification qualifications]
        [:tr
         [:td (:SubjectId Qualification)]
         [:td [:DateTime {:date (:GrantTime Qualification)}]]
         [:td (:IntegerValue Qualification)]
         [:td (:Status Qualification)]
         [:td [:button {:ng-click "deleteQualification(Qualification)"} "Delete"]]])]]]
   [:section.hpad
    [:h3 "Assign Qualification"]
    [:form {:ng-submit "assignQualification($event)"}
     [:label
      [:div [:b "WorkerId"]]
      [:input {:ng-model "$storage.AssignQualification.WorkerId"}]]
     [:label
      [:div [:b "Value"]]
      [:input {:type "number"
               :ng-model "$storage.AssignQualification.IntegerValue"}]]
     [:label
      [:div
       [:input {:type "checkbox"
                :ng-model "$storage.AssignQualification.SendNotification"}]
       [:b "Send Notification"]]]
     [:button "Submit"]]]])
