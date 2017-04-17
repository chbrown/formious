(ns formious.resources
  (:require [formious.db.common :refer [->long]]
            [formious.db
             [access-token :as AccessToken]
             [administrator :as Administrator]
             [aws-account :as AWSAccount]
             [aws-account-administrator :as AWSAccountAdministrator]
             [block :as Block]
             [experiment :as Experiment]
             [participant :as Participant]
             [response :as Response]
             [template :as Template]]
            [liberator.core :refer [run-resource]]))

; thanks, https://github.com/juxt/bidi/issues/95
; https://clojure-liberator.github.io/liberator/tutorial/all-together.html
; also good (albeit old) regarding REST in liberator:
;   https://github.com/clojure-liberator/liberator/issues/6

(defn run
  [request resource-kvs]
  (run-resource request resource-kvs))

(defn run-raw
  [request resource-kvs]
  (get (run request (assoc resource-kvs :as-response (fn [d ctx] {::body d}))) ::body))

(def defaults {:available-media-types ["application/json"]
               :initialize-context #(get-in % [:request :route-params])})
(def multi-defaults (assoc defaults :allowed-methods [:get :post]))
(def single-defaults (assoc defaults :allowed-methods [:get :put]))

(defn resource-list
  "Return map of liberator implementation methods suitable for handling multiple instances of a formious.db/* model"
  [columns all insert!]
  {:available-media-types ["application/json"]
   :allowed-methods [:get :post]
   :handle-ok (fn [_] (all))
   ; :post-redirect? (fn [ctx] {:location ...})
   :post! #(-> % :request :body (select-keys columns) insert!)})

(defn resource-record
  "Return map of liberator implementation methods suitable for handling a single instance of a formious.db/* model"
  [columns blank find-by-id update! delete!]
  {:available-media-types ["application/json"]
   :allowed-methods [:get :put]
   :initialize-context #(get-in % [:request :route-params])
   :exists? (fn [ctx]
              (when-let [record (if (= (:id ctx) "new") (blank) (find-by-id (:id ctx)))]
                {:record record}))
   :handle-ok :record
   :put! (fn [ctx]
           (let [body (-> ctx :request :body (select-keys columns))]
             (update! (:id ctx) body)))
   :delete! (fn [{:keys [:id]}]
              (delete! id))})

(def access-tokens
  (resource-list AccessToken/writable-columns AccessToken/all AccessToken/insert!))

(def access-token
  (resource-record AccessToken/writable-columns
                   AccessToken/blank AccessToken/find-by-id
                   AccessToken/update! AccessToken/delete!))

(def administrators
  (merge (resource-list Administrator/writable-columns Administrator/all Administrator/insert!)
         {:handle-ok (map #(dissoc % :password) (Administrator/all))}))

(def administrator
  (merge (resource-record Administrator/writable-columns
                          Administrator/blank Administrator/find-by-id
                          Administrator/update! Administrator/delete!)
         ; TODO: make the password optional and hash it if it is not empty
         {:handle-ok (fn [ctx] (dissoc (:record ctx) :password))}))

(def aws-accounts
  (resource-list AWSAccount/writable-columns AWSAccount/all AWSAccount/insert!))

(def aws-account
  (resource-record AWSAccount/writable-columns
                   AWSAccount/blank AWSAccount/find-by-id
                   AWSAccount/update! AWSAccount/delete!))

; Administrator <-> AWS Account many2many relationship
; (context "/:administrator_id/aws_accounts" [administrator_id]
;   ; List administrator-AWS accounts linked to this administrator
;   (GET "/" []
;     (-> (AWSAccount/all-by-administrator administrator_id) (ok)))
;   ; Create administrator-AWS account link
;   (POST "/:aws_account_id" [aws_account_id :as {{:strs [priority]} :query-params}]
;     (-> (AWSAccountAdministrator/insert! {:administrator_id administrator_id
;                                           :aws_account_id aws_account_id
;                                           :priority (Long/parseLong priority)})
;         (created)))
;   ; Delete administrator-AWS account link
;   (DELETE "/:aws_account_id" [aws_account_id]
;     (AWSAccountAdministrator/delete! administrator_id aws_account_id)
;     (no-content))))

(def blocks
  (merge multi-defaults {:handle-ok (fn [ctx]
                                      ; list all of an experiment's blocks
                                      (Block/all (:experiment_id ctx)))
                         :post! (fn [ctx]
                                  (-> ctx :request :body
                                      (select-keys Block/writable-columns)
                                      (assoc :experiment_id (:experiment_id ctx))
                                      Block/insert!))}))

(def block
  (merge single-defaults {:exists? (fn [ctx]
                                     (when-let [block (if (= (:id ctx) "new")
                                                        (Block/blank)
                                                        (Block/find-by-id (:experiment_id ctx) (:id ctx)))]
                                       {:record block}))
                          :handle-ok :record
                          :put! (fn [ctx]
                                  (-> ctx :request :body
                                      (select-keys Block/writable-columns)
                                      (Block/update! (:id ctx) (:experiment_id ctx))))
                          :delete! (fn [ctx]
                                     (Block/delete! (:id ctx) (:experiment_id ctx)))}))

(def block-tree
  ; Special non-REST method to get all blocks and sort them into a tree.
  (merge single-defaults {:exists? (fn [ctx]
                                     {:tree (Block/buildTree (Block/all))})
                          :handle-ok :tree
                          ; Special non-REST method to store a tree structure of blocks and in a tree structure.
                          :put! (fn [ctx]
                                  (-> ctx :request :body
                                      ; Ok("Successfully updated block tree")
                                      (Block/updateTree)))}))

(def experiments
  ; experiments.foreach { experiment =>
  ;   Experiment.findOrCreateAccessToken(experiment.id) }
  (resource-list Experiment/writable-columns Experiment/all Experiment/insert!))

(def experiment
  ; Experiment.findOrCreateAccessToken(experiment.id)
  (resource-record Experiment/writable-columns
                   Experiment/blank Experiment/find-by-id
                   Experiment/update! Experiment/delete!))

(def responses
  (merge defaults {:allowed-methods [:get :post]
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
                                                 :assignment_id assignment_id})))}))

(def response
  (merge defaults {:allowed-methods [:get]
                   :exists? (fn [ctx]
                              (when-let [response (Response/find-by-id (:id ctx))]
                                {:record response}))
                   :handle-ok :record}))

; if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
;   ; 303 is a "See other" and SHOULD include a Location header
;   return res.status(303).die('Template already exists')
; }
(def templates
  (resource-list Template/writable-columns Template/all Template/insert!))

; (header "Cache-Control", "max-age=5") ?
; :handle-ok (fn [{:keys [::template]}] (println "template/handle-ok" template) template)
(def template
  (resource-record Template/writable-columns
                   Template/blank Template/find-by-id
                   Template/update! Template/delete!))
