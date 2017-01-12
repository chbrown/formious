(ns com.formious.routes.experiments
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.experiment :as Experiment]
            [com.formious.db.block :as Block]
            [clojure.string :as string]
            [clostache.parser :refer [render render-resource]]
            [compojure.core :refer [GET PATCH POST PUT DELETE context defroutes]]))

(defn- block-url
  [experiment_id block]
  (str "/experiments/" experiment_id "/blocks/" (:id block)))

(defroutes routes
  (GET "/:experiment_id" [experiment_id :<< as-int]
    ; Redirect to first block of experiment
    (if-let [block (Block/next experiment_id)]
      (-> (block-url experiment_id block) (redirect :see-other))
      (not-found "No available blocks")))
  (GET "/:experiment_id/blocks/:block_id" [experiment_id :<< as-int
                                            block_id :<< as-int]
    ; Render block as html
    ; the querystring will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    ; the Amazon Mechanical Turk frame will give us the following variables:
    ; https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
    ; &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
    ; &hitId=123RVWYBAZW00EXAMPLE
    ; &turkSubmitTo=https://www.mturk.com
    ; &workerId=AZ3456EXAMPLE
    (let [experiment (Experiment/find experiment_id)
          block (Block/find experiment_id block_id)
          blockTemplateHtml (or (some-> block :template_id templates/find :html) "")
          ; context: the current state to render the template with
          ; Supply "experiment_id" and "block_id" in the blockContext
          context (into (:context block) {:experiment_id experiment_id
                                          :block_id block_id})
          ; TODO: handle errors (maybe add default for missing html, and use it for broken templates)
          template-html (render blockTemplateHtml context)
          ; TODO: memoize/cache the layout Handlebars template function
          context-json-string (json/write-str context)] ;.replaceAll("<\/".r, "<\\/")
      (-> (render-resource "public/block.html" {:context context-json-string
                                                :header (:html experiment)
                                                :html template-html})
          (content-type "text/html"))))

  (POST "/:experiment_id/blocks/:block_id" [experiment_id :<< as-int
                                            block_id :<< as-int
                                            :as {{:strings [WorkerId AssignmentId]
                                                       :or {WorkerId "WORKER_ID_NOT_AVAILABLE"}} :query-params
                                                 body :body
                                                 headers :headers}]
    ; Save response
    ;val assignmentId = assignmentIdOption.getOrElse("ASSIGNMENT_ID_NOT_AVAILABLE")
    ;val ipAddress = ipAddressHeader ; OrElse(request.remoteAddress.toString)
    ; http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
    ; sadly, this redirect_to doesn't work. Hopefully the user will have a proper
    ; POST-to-MT form in their last block
    ; val redirect_to = urlObj.query.turkSubmitTo + "/mturk/externalSubmit?assignmentId=" + urlObj.query.assignmentId
    (let [ipAddress (:x-real-ip headers)
          userAgent (:user-agent headers)
          requestedWith (:x-requested-with headers)
          participant (participants/findOrCreateByWorkerId workerId, ipAddress, userAgent)
          response (responses/create participant.id, block_id, postData, assignmentIdOption)]
      (if-let [block (Block/next experiment_id, block_id, participant.id)]
        (let [resp (redirect (block-url experiment_id block))]
          (if (string/includes? requestedWith "XMLHttpRequest")
            (no-content resp)
            resp))
        (response "You have already completed all available blocks in this experiment.")))))
