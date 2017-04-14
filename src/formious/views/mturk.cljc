(ns formious.views.mturk
  (:require [rum.core :as rum]))

(rum/defc MTurkLayout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:div {:class "control"}
     [:select {:ng-model "aws_account_id"
               :ng-change "changeSetting('aws_account_id', aws_account_id)"
               :ng-options "aws_account.id.toString() as aws_account.name for aws_account in aws_accounts"}]
     [:select {:ng-model "environment"
               :ng-change "changeSetting('environment', environment)"
               :ng-options "environment.name as environment.name for environment in environments"}]]
    [:span {:ui-sref-active-any "{current: 'admin.mturk.hits'}"
            :class "tab"}
     [:a {:ui-sref "admin.mturk.hits.table"} "HITs"]]
    [:span {:ui-sref-active-any "{current: 'admin.mturk.qualification_types'}"
            :class "tab"}
     [:a {:ui-sref "admin.mturk.qualification_types.table"} "Qualification Types"]]]
   children])

(rum/defc MTurkDashboard
  [AvailableBalance]
  [:div
   [:section.hpad.box
    [:h3 "Notify Workers"]
    [:label
     [:div
      [:b "Subject"]
      [:span {:class "help"}
       "The subject line of the email message to send; up to 200 characters"]]
     [:input {:ng-model "notification.Subject"}]]
    [:label
     [:div
      [:b "Body"]
      [:span {:class "help"}
       "The text of the email message to send; up to 4,096 characters"]]
     [:textarea {:ng-model "notification.MessageText"
                 :style "width: 600px; height: 200px"}]]
    [:label
     [:div
      [:b "WorkerId"]
      [:span {:class "help"}
       "The ID of the Worker to notify, as returned by the GetAssignmentsForHIT operation; repeat this parameter up to 100 times to notify multiple Workers."]]
     [:input {:ng-model "notification.WorkerId"}]]
    [:div [:button {:ng-click "NotifyWorkers()"} "Notify Workers"]]]
   [:section.hpad.box
    [:h3 "Available Balance"]
    [:p (:FormattedPrice AvailableBalance)]]])

(rum/defc MTurkAssignment
  [assignment]
  [:div
   [:div {:class "hpad"}
    [:h3 "Assignment: " (:AssignmentId assignment)]
    [:h4 "WorkerId: " (:WorkerId assignment)]]
   [:section {:class "hpad"
              :ng-if "$storage.assignments_show_times"}
    [:table {:class "keyval"}
     [:tr [:td "AutoApprovalTime"] [:td (:AutoApprovalTime assignment)]]
     [:tr [:td "AcceptTime"] [:td (:AcceptTime assignment)]]
     [:tr [:td "SubmitTime"] [:td (:SubmitTime assignment)]]
     [:tr [:td "ApprovalTime"] [:td (:ApprovalTime assignment)]]]]
   [:section.hpad
    [:div
     [:b "Status:"]
     [:span {:class "{assignment.AssignmentStatus}"}
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
     [:span {:class "help"} "1024 character max"]]]
   [:section {:class "hpad"
              :ng-if "$storage.assignments_show_bonus"}
    [:b "Bonus:"]
    [:label [:input {:ng-model "bonus.bonus_owed"
                     :placeholder "Amount"}]]
    [:label [:input {:ng-model "bonus.reason"
                     :placeholder "Reason"}]]
    [:button {:ng-click "grantBonus()"} "Grant Bonus"]]
   [:section {:class "hpad"
              :ng-if "$storage.assignments_show_block"}
    [:button {:ng-click "blockWorker(blockWorkerReason)"} "Block Worker"]
    [:input {:ng-model "blockWorkerReason"
             :placeholder "Reason"}]]
   [:div {:class "hpad"
          :ng-if "$storage.assignments_show_answer"}
    [:h4 "Assignment Answer"]
    [:table {:class "keyval"}
     (for [[key val] (:Answer assignment)]
       [:tr
        [:td {:ng-bind "key"}]
        [:td {:ng-bind "val"}]])]]
   [:section.hpad
    [:h4 "Responses"]
    [:div {:ng-if "responses"
           :object "responses"}]]])
