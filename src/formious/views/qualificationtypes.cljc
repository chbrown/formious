(ns formious.views.qualificationtypes
  (:require [rum.core :as rum]
            [formious.views.common :refer [Link Help datetime]]))

(def $storage {:todo "Pull this from global state"})

(rum/defc QualificationTypeTable
  [qualificationtypes]
  [:div
   [:section.hpad
    [:h3 "Qualification Types"]
    [:a {:ui-sref "admin.mturk.qualificationtypes.new"}
     "Create new Qualification Type"]]
   [:section.hpad.box
    [:label
     [:div
      [:b "Query"]
      (Help "A text query against all of the searchable attributes of Qualification types.")]
     [:input {:ng-model "SearchQualificationTypes.Query"}]]
    [:label
     [:div
      [:b "SortDirection"]
      (Help "A text query against all of the searchable attributes of Qualification types.")]
     [:select {:ng-model "SearchQualificationTypes.SortDirection"}
      [:option {:value "Ascending"} "Ascending"]
      [:option {:value "Descending"} "Descending"]]]
    [:label
     [:div
      [:b "Page Size"]
      (Help "The number of Qualification types to include in a page of results. The operation divides the complete sorted result set into pages of this many Qualification types.")]
     [:input {:type "number"
              :min "1"
              :max "100"
              :ng-model "SearchQualificationTypes.PageSize"}]]
    [:label
     [:div
      [:b "Page Number"]
      (Help "The page of results to return. After the operation filters, sorts, and divides the Qualification types into pages of size PageSize, it returns page corresponding to PageNumber as the results of the operation.")]
     [:input {:type "number"
              :min "1"
              :ng-model "SearchQualificationTypes.PageNumber"}]]
    [:label
     [:div
      [:input {:type "checkbox"
               :ng-model "SearchQualificationTypes.MustBeRequestable"}]
      [:b "Must Be Requestable"]
      (Help "Specifies that only Qualification types that a user can request through the Amazon Mechanical Turk web site, such as by taking a Qualification test, are returned as results of the search. Some Qualification types, such as those assigned automatically by the system, cannot be requested directly by users. If false, all Qualification types, including those managed by the system, are considered for the search.")]]
    [:label
     [:div
      [:input {:type "checkbox"
               :ng-model "SearchQualificationTypes.MustBeOwnedByCaller"}]
      [:b "Must Be Owned By Caller"]
      (Help "Specifies that only Qualification types that the Requester created are returned. If false, the operation returns all Qualification types.")]]]
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
      (for [QualificationType qualificationtypes]
        [:tr
         [:td
          [:a {:ui-sref "admin.mturk.qualificationtypes.edit({QualificationTypeId: QualificationType.QualificationTypeId})"}
           (:QualificationTypeId QualificationType)]]
         [:td (datetime (:CreationTime QualificationType))]
         [:td (:Name QualificationType)]
         [:td (:Description QualificationType)]
         [:td (:Keywords QualificationType)]
         [:td (:QualificationTypeStatus QualificationType)]
         [:td [:button {:ng-click "delete(QualificationType)"} "Delete"]]])]]]])

(rum/defc QualificationTypeEdit
  [QualificationType]
  [:div
   (when-not (:QualificationTypeId QualificationType)
     [:label.block
      [:div
       [:b "Name"]
       (Help "The name of the Qualification type. The type name is used to represent the Qualification to Workers, and to find the type using a Qualification type search.")]
      [:input {:type "text"
               :ng-model (:Name QualificationType)
               :style {:width "500px"}}]])
   [:label.block
    [:div
     [:b "Description"]
     (Help "A long description for the Qualification type. On the Amazon Mechanical Turk website, the long description is displayed when a Worker examines a Qualification type. 2000 character maximum.")]
    [:textarea {:ng-model (:Description QualificationType)
                :rows "2"
                :style {:width "500px"}}]]
   (when-not (:QualificationTypeId QualificationType)
     [:label.block
      [:div
       [:b "Keywords"]
       (Help "One or more words or phrases that describe the Qualification type, separated by commas. The keywords of a type make the type easier to find during a search.")]
      [:input {:type "text"
               :ng-model "QualificationType.Keywords"
               :style {:width "500px"}}]])
   [:label.block
    [:div
     [:b "Retry Delay (e.g., 60m)"]
     (Help "The amount of time that a Worker must wait after requesting a Qualification of the Qualification type before the worker can retry the Qualification request.")]
    [:input {:type "text"
             :ng-model (:RetryDelayInSeconds QualificationType)
             :duration-string true}]]
   [:label.block
    [:div
     [:b "Status"]
     (Help "The initial status of the Qualification type.")]
    [:select {:ng-model (:QualificationTypeStatus QualificationType)}
     [:option {:value "Active"} "Active"]
     [:option {:value "Inactive"} "Inactive"]]]
   [:label.block
    [:div
     [:b "Test"]
     (Help "The questions for the Qualification test a Worker must answer correctly to obtain a Qualification of this type, in the form of a QuestionForm data structure. Must not be be specified if " [:code "Auto Granted"] " is checked.")]
    [:span [:i "Not yet implemented."]]]
   [:label.block {:ng-show (:Test QualificationType)}
    [:div
     [:b "Test Duration"]
     (Help "The amount of time the Worker has to complete the Qualification test, starting from the time the Worker requests the Qualification. Required if the Test parameter is specified.")]
    [:input {:type "text"
             :ng-model (:TestDuration QualificationType)}]]
   [:label.block {:ng-show (:Test QualificationType)}
    [:div
     [:b "AnswerKey"]
     (Help "The answers to the Qualification test specified in the Test parameter, in the form of an AnswerKey data structure.")]
    [:span [:i "Not yet implemented."]]]
   [:label.block
    [:div
     [:input {:type "checkbox"
              :ng-model (:AutoGranted QualificationType)
              :ng-true-value "1"
              :ng-false-value "0"}]
     [:b "Auto Granted"]
     (Help "Specifies whether requests for the Qualification type are granted immediately, without prompting the Worker with a Qualification test.")]]
   (when (:AutoGranted QualificationType)
     [:label.block
      [:div
       [:b "Auto Granted Value"]
       (Help "The Qualification value to use for automatically granted Qualifications.")]
      [:input {:ng-model (:AutoGrantedValue QualificationType)}]])])

(rum/defc QualificationTypeNew
  []
  [:div
   [:section.hpad [:h3 "CreateQualificationType"]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:ng-include {:src "'/ui/admin/mturk/qualificationtypes/form.html'"}]
     [:div.block [:button "Submit"]]]]])

(defn deleteQualification
  [Qualification]
  (println "TODO: actually delete qualification" Qualification))

(rum/defc QualificationTypeOne
  [QualificationType qualifications]
  [:div
   [:section.hpad
    [:h3 "Qualification Type: " (:QualificationTypeId QualificationType)]
    [:h4 "Name: " (:Name QualificationType)]
    [:h4 "Keywords: " (:Keywords QualificationType)]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:ng-include {:src "'/ui/admin/mturk/qualificationtypes/form.html'"}]
     [:div.block [:button "Submit"]]]]
   [:section.hpad [:h3 "Qualifications"]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead
      [:tr
       [:th "Subject Id"]
       [:th "Grant Time"]
       [:th "Integer Value"]
       [:th "Status"]
       [:th]]]
     [:tbody
      (for [Qualification qualifications]
        [:tr
         [:td (:SubjectId Qualification)]
         [:td (datetime (:GrantTime Qualification))]
         [:td (:IntegerValue Qualification)]
         [:td (:Status Qualification)]
         [:td [:button {:on-click (fn [_] (deleteQualification Qualification))} "Delete"]]])]]]
   [:section.hpad
    [:h3 "Assign Qualification"]
    [:form {:ng-submit "assignQualification($event)"}
     [:label
      [:div [:b "WorkerId"]]
      [:input {:ng-model (-> $storage :AssignQualification :WorkerId)}]]
     [:label
      [:div [:b "Value"]]
      [:input {:type "number"
               :ng-model (-> $storage :AssignQualification :IntegerValue)}]]
     [:label
      [:div
       [:input {:type "checkbox"
                :ng-model (-> $storage :AssignQualification :SendNotification)}]
       [:b "Send Notification"]]]
     [:button "Submit"]]]])
