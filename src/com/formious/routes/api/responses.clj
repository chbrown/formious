(ns com.formious.routes.api.responses
  (:require [com.formious.common :refer [created]]
            [com.formious.db.response :as Response]
            [com.formious.db.participant :as Participant]
            [ring.util.response :refer [not-found]]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET POST defroutes]]))

(defroutes routes
  (GET "/" {{:strs [limit experiment_id template_id aws_worker_id] :or {limit "250"}} :query-params}
    (let [maxLimit (min (Long/parseLong limit) 1000)]
      (Response/all-where maxLimit experiment_id template_id aws_worker_id)))
  (POST "/" {{:strs [participant_id aws_worker_id]} :query-params
             {:strs [block_id data assignment_id]} :body}
    (if-let [participant (Participant/find-or-create participant_id aws_worker_id)]
      (-> (Response/insert! (:id participant) block_id data assignment_id) (created))
      (not-found "No matching participant found")))
  (GET "/:id" [id :<< as-int]
    (Response/find-by-id id)))
