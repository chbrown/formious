(ns com.formious.routes.api.responses
  (:require [com.formious.common :refer [created]]
            [com.formious.db.response :as Response]
            [ring.util.response :refer [resource-response not-found]]
            [compojure.core :refer [GET POST defroutes]]))

(defroutes routes
  (GET "/" {{:strings [limit experiment_id template_id aws_worker_id] :or {limit "250"}} :query-params}
    (let [maxLimit (min (Long/parseLong limit) 1000)]
      (Response/allWhere maxLimit, experiment_id, template_id, aws_worker_id)))
  (POST "/" {{:strings [participant_id aws_worker_id]} :query-params
             {:strings [block_id, data, assignment_id]} :body}
    (if-let [participant (Participant/find-or-create participant_id, aws_worker_id)]
      (-> (Response/create (:id participant), block_id, data, assignment_id) (created))
      (not-found "No matching participant found")))
  (GET "/:id" [id :<< as-int]
    (Response/find id)))
