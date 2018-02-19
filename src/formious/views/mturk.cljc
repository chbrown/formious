(ns formious.views.mturk
  (:require [rum.core :as rum]
            [formious.routes :as routes :refer [generate-path]]
            [formious.views.common :refer [Link Help ObjectDisplay datetime]]))

(def $storage {:todo "Pull this from global state"})

(rum/defc MTurkLayout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:div.control
     [:select {:ng-model "awsaccount_id"
               :ng-change "changeSetting('awsaccount_id', awsaccount_id)"
               :ng-options "awsaccount.id.toString() as awsaccount.name for awsaccount in awsaccounts"}]
     [:select {:ng-model "environment"
               :ng-change "changeSetting('environment', environment)"
               :ng-options "environment.name as environment.name for environment in environments"}]]
    (Link {:endpoint ::routes/mturk-hit :HITId nil} "HITs")
    (Link {:endpoint ::routes/mturk-qualificationtype :QualificationTypeId nil} "Qualification Types")]
   children])

(rum/defc MTurkDashboard
  [AvailableBalance notification]
  [:div
   [:section.hpad.box
    [:h3 "Notify Workers"]
    [:label
     [:div
      [:b "Subject"]
      (Help "The subject line of the email message to send; up to 200 characters")]
     [:input {:default-value (:Subject notification)}]]
    [:label
     [:div
      [:b "Body"]
      (Help "The text of the email message to send; up to 4,096 characters")]
     [:textarea {:style {:width "600px" :height "200px"}
                 :default-value (:MessageText notification)}]]
    [:label
     [:div
      [:b "WorkerId"]
      (Help "The ID of the Worker to notify, as returned by the GetAssignmentsForHIT operation; repeat this parameter up to 100 times to notify multiple Workers.")]
     [:input {:default-value (:WorkerId notification)}]]
    [:div [:button {:ng-click "NotifyWorkers()"} "Notify Workers"]]]
   [:section.hpad.box
    [:h3 "Available Balance"]
    [:p (:FormattedPrice AvailableBalance)]]])

(rum/defc MTurkAssignment
  [assignment responses]
  [:div
   [:div.hpad
    [:h3 "Assignment: " (:AssignmentId assignment)]
    [:h4 "WorkerId: " (:WorkerId assignment)]]
   (when (:assignments_show_times $storage)
     [:section.hpad
      [:table.keyval
       [:tr [:td "AutoApprovalTime"] [:td (:AutoApprovalTime assignment)]]
       [:tr [:td "AcceptTime"]       [:td (:AcceptTime assignment)]]
       [:tr [:td "SubmitTime"]       [:td (:SubmitTime assignment)]]
       [:tr [:td "ApprovalTime"]     [:td (:ApprovalTime assignment)]]]])
   [:section.hpad
    [:div
     [:b "Status:"]
     [:span {:class (:AssignmentStatus assignment)}
      (:AssignmentStatus assignment)]]
    [:span {:ng-show "assignment.AssignmentStatus == 'Submitted'"}
     [:button {:ng-click "setStatus('ApproveAssignment')"} "Approve"]
     [:button {:ng-click "setStatus('RejectAssignment')"} "Reject"]]
    [:span {:ng-show "assignment.AssignmentStatus == 'Rejected'"}
     [:button {:ng-click "setStatus('ApproveRejectedAssignment')"}
      "Unreject and Approve"]]
    [:span {:ng-show "assignment.AssignmentStatus == 'Submitted' || assignment.AssignmentStatus == 'Rejected'"}
     [:input {:ng-model "RequesterFeedback"
              :placeholder "Requester Feedback"}]
     (Help "1024 character max")]]
   (when (:assignments_show_bonus $storage)
     [:section.hpad
      [:b "Bonus:"]
      [:label [:input {:ng-model "bonus.bonus_owed"
                       :placeholder "Amount"}]]
      [:label [:input {:ng-model "bonus.reason"
                       :placeholder "Reason"}]]
      [:button {:ng-click "grantBonus()"} "Grant Bonus"]])
   (when (:assignments_show_block $storage)
     [:section.hpad
      [:button {:ng-click "blockWorker(blockWorkerReason)"} "Block Worker"]
      [:input {:ng-model "blockWorkerReason"
               :placeholder "Reason"}]])
   (when (:assignments_show_answer $storage)
     [:div.hpad
      [:h4 "Assignment Answer"]
      [:table.keyval
       (for [[key val] (:Answer assignment)]
         [:tr
          [:td key]
          [:td val]])]])
   [:section.hpad
    [:h4 "Responses"]
    [:div (when responses (ObjectDisplay responses))]]])
