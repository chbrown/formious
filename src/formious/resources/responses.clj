(ns formious.resources.responses
  (:require [formious.db.common :refer [->long]]
            [formious.db.response :as Response]
            [formious.db.participant :as Participant]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [defaults]]))

(defresource responses defaults
  :allowed-methods [:get :post]
  :handle-ok (fn [ctx]
               (let [{:strs [limit experiment_id template_id aws_worker_id]
                      :or   {limit "250"}} (:query-params ctx)
                     max-limit (min (->long limit) 1000)]
                 (Response/all-where max-limit experiment_id template_id aws_worker_id)))
  :post! (fn [ctx]
           (let [{:keys [body query-params]} ctx
                 {:strs [block_id data assignment_id]} body
                 {:strs [participant_id aws_worker_id]} query-params
                 participant (Participant/find-or-create! participant_id aws_worker_id)]
             (when (nil? participant) (throw (Exception. "No matching participant found")))
             (Response/insert! {:participant_id (:id participant)
                                :block_id block_id
                                :data data
                                :assignment_id assignment_id}))))

(defresource response defaults
  :allowed-methods [:get]
  :exists? (fn [ctx]
             (when-let [response (Response/find-by-id (:id ctx))]
               {:record response}))
  :handle-ok :record)
