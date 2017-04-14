(ns formious.handlers.experiments
  (:require [formious.db.administrator :as Administrator]
            [formious.db.block :as Block]
            [formious.db.experiment :as Experiment]
            [formious.db.participant :as Participant]
            [formious.db.response :as Response]
            [formious.db.template :as Template]
            [clojure.string :as str]
            [clojure.data.json :as json]
            [clojure.java.io :as io]
            [rum.core :as rum]
            [formious.views.common :refer [render-static-markup-with-doctype block-layout]]
            [clostache.parser :refer [render render-resource]]
            [ring.util.response :refer [not-found redirect response content-type status]]))

(defn redirect-to-next-block
  "Redirect to next (probably first) block of experiment"
  [request]
  (let [{:keys [experiment-id]} (:route-params request)]
    (if-let [block (Block/next-in-experiment experiment-id)]
      (-> (str "/experiments/" experiment-id "/blocks/" (:id block))
          (redirect :see-other))
      (not-found "No available blocks"))))

(defn- save-response!
  [WorkerId AssignmentId block_id body ip-address user-agent]
  (let [participant (Participant/find-or-create-by-worker-id! WorkerId
                                                              :ip_address ip-address
                                                              :user_agent user-agent)]
    (Response/insert! {:participant_id (:id participant)
                       :block_id block_id
                       :data body
                       :assignment_id AssignmentId})))

(defn render-block
  "GET; Render block as html
  the querystring will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
  the Amazon Mechanical Turk frame will give us the following variables:
  https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
  &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
  &hitId=123RVWYBAZW00EXAMPLE
  &turkSubmitTo=https://www.mturk.com
  &workerId=AZ3456EXAMPLE"
  [request]
  ; otherwise, assume
  (let [{:keys [experiment-id block-id]} (:route-params request)
        experiment (Experiment/find-by-id experiment-id)
        block (Block/find-by-id experiment-id block-id)
        blockTemplateHtml (or (some-> block :template_id Template/find-by-id :html) "")
        ; context: the current state to render the template with
        ; Supply "experiment_id" and "block_id" in the blockContext
        context (into (:context block) {:experiment_id experiment-id
                                        :block_id block-id})
        ; TODO: handle errors (maybe add default for missing html, and use it for broken templates)
        template-html (render blockTemplateHtml context)
        ; TODO: memoize/cache the layout Handlebars template function
        context-json-string (json/write-str context)] ;.replaceAll("<\/".r, "<\\/")
    (-> (block-layout context-json-string (:html experiment) template-html)
        (render-static-markup-with-doctype)
        (response)
        (content-type "text/html"))))

(defn save-block-and-redirect
  "POST; Save response
  val assignmentId = assignmentIdOption.getOrElse('ASSIGNMENT_ID_NOT_AVAILABLE')
  val ipAddress = ipAddressHeader ; OrElse(request.remoteAddress.toString)
  http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
  sadly, this redirect_to doesn't work. Hopefully the user will have a proper
  POST-to-MT form in their last block
  val redirect_to = urlObj.query.turkSubmitTo + '/mturk/externalSubmit?assignmentId=' + urlObj.query.assignmentId"
  [request]
  (let [{:keys [body headers query-params request-params]} request
        {:keys [experiment-id block-id]} request-params
        {:strs [WorkerId AssignmentId]
         :or   {WorkerId "WORKER_ID_NOT_AVAILABLE"}} query-params
        {:keys [x-real-ip user-agent x-requested-with]} headers
        response (save-response! WorkerId AssignmentId block-id body x-real-ip user-agent)]
    (if-let [block (Block/next-in-experiment experiment-id)]
      ; redirect with default of 302 (:found)
      (let [resp (redirect (str "/experiments/" experiment-id "/blocks/" (:id block)))]
        (if (str/includes? x-requested-with "XMLHttpRequest")
          (status (response resp) 204)
          resp))
      (response "You have already completed all available blocks in this experiment."))))
