(ns formious.server.resources
  (:require [clojure.tools.logging :as log]
            [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.resources :as resources]
            [formious.resources.sql :as sql]
            [honeysql.core :as honeysql]
            [formious.db :as db]
            [formious.db.block :refer [buildTree updateTree]]
            [formious.db.util :refer [find-or-create-participant!]]
            [liberator.core :refer [run-resource]]))

; thanks, https://github.com/juxt/bidi/issues/95
; https://clojure-liberator.github.io/liberator/tutorial/all-together.html
; also good (albeit old) regarding REST in liberator:
;   https://github.com/clojure-liberator/liberator/issues/6

(defn run
  [request resource-kvs]
  (run-resource request resource-kvs))

(defn run-raw
  "Monkeypatch the :as-response of the given Liberator resource map `resource-kvs`
  to return a map with the response data under the :formious.server.resources/body key,
  which Liberator merges into the full response.
  This function then pulls out that value, so that the body is the only part of the response that's returned."
  [request resource-kvs]
  (get (run request (assoc resource-kvs :as-response (fn [d ctx] {::body d}))) ::body))

(defn resource-list
  "Return map of liberator implementation methods suitable for handling multiple instances of a formious.db/* model"
  [resource]
  (let [{:keys [writable-columns]} (get resources/metadata resource)]
    {:available-media-types ["application/json"]
     :allowed-methods [:get :post]
     :handle-ok (fn [_]
                  ; TODO: implement metadata-based ORDER BY customization
                  (-> (sql/select resource) honeysql/format db/query))
     ; :post-redirect? (fn [ctx] {:location ...})
     :post! (fn [ctx]
              ; TODO: ensure administrator creation is properly handled
              (let [value-params (-> ctx :request :body (select-keys writable-columns))]
                (db/insert! (resources/table resource) value-params)))}))

(defn- find-record
  "Helper function used by resource-record's :exists? handler"
  [resource id]
  (if (= id "new")
    ; get blank for "new" records
    (assoc (get-in resources/metadata [resource :blank]) :created (now))
    ; otherwise, query the database
    ; TODO: handle other primary keys
    ; TODO: check if we need to convert the id parameters?
    (-> (sql/select resource {:id id}) honeysql/format db/query first)))

(defn resource-record
  "Return map of liberator implementation methods,
  suitable for handling a single instance of a formious.db/* model."
  [resource]
  (let [{:keys [pk-columns writable-columns]} (get resources/metadata resource)]
    {:available-media-types ["application/json"]
     :allowed-methods [:get :put :delete]
     ; The result of initialize-context is merged with the standard fields:
     ; :representation, :request, :resource
     :initialize-context #(get-in % [:request :route-params])
     :exists? (fn [ctx]
                ; TODO: handle other primary keys
                (when-let [record (find-record resource (get ctx :id))]
                  {:record record}))
     :handle-ok :record
     ; :handle-ok (fn [{:keys [record]}] (println "resource-record/handle-ok; record:" record) record) ; for debugging
     :put! (fn [ctx]
             (let [body (-> ctx :request :body (select-keys writable-columns))]
               ; TODO: handle other PKs, convert IDs, separate set/where params better
               (-> (sql/update resource body {:id (get ctx :id)}) honeysql/format db/execute!)))
     :delete! (fn [ctx]
                (->> (select-keys ctx pk-columns)
                     (sql/delete-by-pk resource)
                     honeysql/format
                     db/execute!))}))

(def accesstokens
  (resource-list ::resources/accesstoken))

(def accesstoken
  (resource-record ::resources/accesstoken))

(def administrators
  (resource-list ::resources/administrator))

(def administrator
  ; TODO: make the password optional and hash it if it is not empty
  (resource-record ::resources/administrator))

(def awsaccounts
  (resource-list ::resources/awsaccount))

(def awsaccount
  (resource-record ::resources/awsaccount))

; Administrator <-> AWS Account many2many relationship
; (context "/:administrator_id/awsaccounts" [administrator_id]
;   ; List administrator-AWS accounts linked to this administrator
;   (GET "/" []
;     (-> (AWSAccount/all-by-administrator administrator_id) (ok)))
;   ; Create administrator-AWS account link
;   (POST "/:awsaccount_id" [awsaccount_id :as {{:strs [priority]} :query-params}]
;     (-> (AWSAccountAdministrator/insert! {:administrator_id administrator_id
;                                           :awsaccount_id awsaccount_id
;                                           :priority (Long/parseLong priority)})
;         (created)))
;   ; Delete administrator-AWS account link
;   (DELETE "/:awsaccount_id" [awsaccount_id]
;     (AWSAccountAdministrator/delete! administrator_id awsaccount_id)
;     (no-content))))

(def blocks
  (let [resource ::resources/block
        {:keys [writable-columns]} (get resources/metadata resource)]
    (assoc (resource-list resource)
      :initialize-context #(get-in % [:request :route-params])
      :handle-ok (fn [{:keys [experiment_id] :as ctx}]
                   ; list all of an experiment's blocks
                   ; TODO: fix ordering
                   (-> (sql/select resource {:experiment_id experiment_id}) honeysql/format db/query))
      :post! (fn [{:keys [experiment_id request] :as ctx}]
               (let [value-params (-> (:body request)
                                      (select-keys writable-columns)
                                      (assoc :experiment_id experiment_id))]
                 (db/insert! (resources/table resource) value-params))))))

(def block
  (let [resource ::resources/block
        {:keys [pk-columns writable-columns blank]} (get resources/metadata resource)]
    (assoc (resource-record resource)
      :initialize-context #(get-in % [:request :route-params])
      :exists? (fn [{:keys [id experiment_id] :as ctx}]
                 (when-let [record (if (= id "new")
                                     (assoc blank :created (now) :experiment_id experiment_id)
                                     (-> (sql/select resource {:id id :experiment_id experiment_id})
                                         honeysql/format
                                         db/query
                                         first))]
                   {:record record})))
    :put! (fn [{:keys [id experiment_id request] :as ctx}]
            (let [body (-> request :body (select-keys writable-columns))]
              (-> (sql/update resource body {:id id :experiment_id experiment_id}) honeysql/format db/execute!)))
    :delete! (fn [ctx]
               (->> (select-keys ctx pk-columns)
                    (sql/delete-by-pk resource)
                    honeysql/format
                    db/execute!))))

(def block-tree
  ; Special non-REST method to get all blocks and sort them into a tree.
  {:available-media-types ["application/json"]
   :initialize-context #(get-in % [:request :route-params])
   :allowed-methods [:get :put]
   :exists? (fn [{:keys [experiment_id] :as ctx}]
              (->> (sql/select ::resources/block {:experiment_id experiment_id})
                   honeysql/format
                   db/query
                   buildTree
                   (hash-map :tree)))
   :handle-ok :tree
   ; Special non-REST method to store a tree structure of blocks and in a tree structure.
   :put! (fn [{:keys [experiment_id request] :as ctx}]
           (println "Updating block tree")
           (updateTree (:body request) experiment_id))})

(def experiments
  ; experiments.foreach { experiment =>
  ;   Experiment.findOrCreateAccessToken(experiment.id) }
  (resource-list ::resources/experiment))

(def experiment
  ; Experiment.findOrCreateAccessToken(experiment.id)
  (resource-record ::resources/experiment))

(defn- query-responses
  [limit experiment_id template_id aws_worker_id]
  ; 'id' and 'created' from the other tables conflict with responses
  (db/query ["SELECT *, response.id AS id, response.created AS created, COUNT(response.id) OVER() AS count
              FROM response
                INNER JOIN participant ON participant.id = response.participant_id
                INNER JOIN block ON block.id = response.block_id
              WHERE (block.experiment_id = ? OR ?::int IS NULL)
                AND (block.template_id = ? OR ?::int IS NULL)
                AND (participant.aws_worker_id = ? OR ?::text IS NULL)
              ORDER BY response.created DESC
              LIMIT ?"
             experiment_id experiment_id
             template_id template_id
             aws_worker_id aws_worker_id
             limit]))

(def responses
  (assoc (resource-list ::resources/response)
    :initialize-context #(get-in % [:request :route-params])
    :handle-ok (fn [ctx]
                 (let [{:strs [limit experiment_id template_id aws_worker_id]
                        :or   {limit "250"}} (:query-params ctx)
                       max-limit (min (as-long limit) 1000)]
                   (query-responses max-limit experiment_id template_id aws_worker_id)))
    :post! (fn [{:keys [body query-params] :as ctx}]
             (let [{:strs [block_id data assignment_id]} body
                   {:strs [participant_id aws_worker_id]} query-params
                   participant (find-or-create-participant! participant_id aws_worker_id)]
               (when (nil? participant)
                 (throw (ex-info "No matching participant found" query-params)))
               (db/insert! "response" {:participant_id (:id participant)
                                       :block_id block_id
                                       :data data
                                       :assignment_id assignment_id})))))

(def response
  (assoc (resource-record ::resources/response)
    :allowed-methods [:get]))

(def templates
  "TODO: when inserting, if we incur a 'duplicate key value violates unique constraint' exception,
  redirect with HTTP 303 ('See other'), including a Location header to the existing template,
  and set the response to 'Template already exists'"
  (resource-list ::resources/template))

(def template
  ; TODO: maybe set a caching header like (header res "Cache-Control" "max-age=5")
  (resource-record ::resources/template))

(def endpoint-mapping
  "Mapping from api-resource-endpoint -> route-keyset -> liberator resource"
  ; in Clojure 1.9, prepend map with #::resources
  ; [::resources/block-tree #{:experiment_id}] #(run % block-tree)
  {::resources/accesstoken   {#{}                   accesstokens
                              #{:id}                accesstoken}
   ::resources/administrator {#{}                   administrators
                              #{:id}                administrator}
   ::resources/awsaccount    {#{}                   awsaccounts
                              #{:id}                awsaccount}
   ::resources/experiment    {#{}                   experiments
                              #{:id}                experiment}
   ::resources/block         {#{:experiment_id}     blocks
                              #{:experiment_id :id} block}
   ::resources/response      {#{}                   responses
                              #{:id}                response}
   ::resources/template      {#{}                   templates
                              #{:id}                template}})
