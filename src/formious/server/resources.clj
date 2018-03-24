(ns formious.server.resources
  (:require [clojure.tools.logging :as log]
            [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.resources :as resources]
            [formious.resources.sql :as sql]
            [honeysql.core :as honeysql]
            [formious.db :as db]
            [formious.db.util :refer [find-or-create-participant!]]
            [formious.db
             [accesstoken :as AccessToken]
             [administrator :as Administrator]
             [awsaccount :as AWSAccount]
             [awsaccount-administrator :as AWSAccountAdministrator]
             [block :as Block]
             [experiment :as Experiment]
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
  "Monkeypatch the :as-response of the given Liberator resource map `resource-kvs`
  to return a map with the response data under the :formious.server.resources/body key,
  which Liberator merges into the full response.
  This function then pulls out that value, so that the body is the only part of the response that's returned."
  [request resource-kvs]
  (get (run request (assoc resource-kvs :as-response (fn [d ctx] {::body d}))) ::body))

(defn resource-list
  "Return map of liberator implementation methods suitable for handling multiple instances of a formious.db/* model"
  [resource all insert!]
  (let [{:keys [writable-columns]} (get resources/metadata resource)]
    {:available-media-types ["application/json"]
     :allowed-methods [:get :post]
     :handle-ok (fn [_] (all))
     ; :post-redirect? (fn [ctx] {:location ...})
     :post! #(-> % :request :body (select-keys writable-columns) insert!)}))

(defn resource-record
  "Return map of liberator implementation methods,
  suitable for handling a single instance of a formious.db/* model."
  [resource id-key find-by-id update!]
  (let [{:keys [pk-columns writable-columns blank]} (get resources/metadata resource)]
    {:available-media-types ["application/json"]
     :allowed-methods [:get :put :delete]
     ; The result of initialize-context is merged with the standard fields:
     ; :representation, :request, :resource
     :initialize-context #(get-in % [:request :route-params])
     :exists? (fn [ctx]
                (when-let [record (if (= (get ctx id-key) "new")
                                    (assoc blank :created (now))
                                    (find-by-id (get ctx id-key)))]
                  {:record record}))
     :handle-ok :record
     ; :handle-ok (fn [{:keys [record]}] (println "resource-record/handle-ok; record:" record) record) ; for debugging
     :put! (fn [ctx]
             (let [body (-> ctx :request :body (select-keys writable-columns))]
               (update! (get ctx id-key) body)))
     :delete! (fn [ctx]
                (->> (select-keys ctx pk-columns)
                     (sql/delete-by-pk resource)
                     honeysql/format
                     db/execute!))}))

(def accesstokens
  (resource-list ::resources/accesstoken
                 AccessToken/all AccessToken/insert!))

(def accesstoken
  (resource-record ::resources/accesstoken :id
                   AccessToken/find-by-id
                   AccessToken/update!))

(def administrators
  (assoc (resource-list ::resources/administrator Administrator/all Administrator/insert!)
    :handle-ok (map #(dissoc % :password) (Administrator/all))))

(def administrator
  (assoc (resource-record ::resources/administrator :id
                          Administrator/find-by-id
                          Administrator/update!)
    ; TODO: make the password optional and hash it if it is not empty
    :handle-ok (fn [ctx] (dissoc (:record ctx) :password))))

(def awsaccounts
  (resource-list ::resources/awsaccount AWSAccount/all AWSAccount/insert!))

(def awsaccount
  (resource-record ::resources/awsaccount :id
                   AWSAccount/find-by-id
                   AWSAccount/update!))

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
  (let [{:keys [writable-columns]} (get resources/metadata ::resources/block)]
    {:available-media-types ["application/json"]
     :initialize-context #(get-in % [:request :route-params])
     :allowed-methods [:get :post]
     :handle-ok (fn [ctx]
                    ; list all of an experiment's blocks
                  (Block/all (:experiment_id ctx)))
     :post! (fn [ctx]
              (-> ctx :request :body
                  (select-keys writable-columns)
                  (assoc :experiment_id (:experiment_id ctx))
                  Block/insert!))}))

(def block
  (let [resource ::resources/block
        {:keys [pk-columns writable-columns blank]} (get resources/metadata resource)]
    {:available-media-types ["application/json"]
     :initialize-context #(get-in % [:request :route-params])
     :allowed-methods [:get :put]
     :exists? (fn [ctx]
                (when-let [block (if (= (get ctx :id) "new")
                                   (assoc blank :created (now))
                                   (Block/find-by-id (:experiment_id ctx) (get ctx :id)))]
                  {:record block}))
     :handle-ok :record
     :put! (fn [ctx]
             (-> ctx :request :body
                 (select-keys writable-columns)
                 (Block/update! (get ctx :id) (:experiment_id ctx))))
     :delete! (fn [ctx]
                (->> (select-keys ctx pk-columns)
                     (sql/delete-by-pk resource)
                     honeysql/format
                     db/execute!))}))

(def block-tree
  ; Special non-REST method to get all blocks and sort them into a tree.
  {:available-media-types ["application/json"]
   :initialize-context #(get-in % [:request :route-params])
   :allowed-methods [:get :put]
   :exists? (fn [ctx]
              {:tree (Block/buildTree (Block/all))})
   :handle-ok :tree
   ; Special non-REST method to store a tree structure of blocks and in a tree structure.
   :put! (fn [ctx]
           (-> ctx :request :body
               ; Ok("Successfully updated block tree")
               (Block/updateTree)))})

(def experiments
  ; experiments.foreach { experiment =>
  ;   Experiment.findOrCreateAccessToken(experiment.id) }
  (resource-list ::resources/experiment Experiment/all Experiment/insert!))

(def experiment
  ; Experiment.findOrCreateAccessToken(experiment.id)
  (resource-record ::resources/experiment :id
                   Experiment/find-by-id
                   Experiment/update!))

(def responses
  {:available-media-types ["application/json"]
   :initialize-context #(get-in % [:request :route-params])
   :allowed-methods [:get :post]
   :handle-ok (fn [ctx]
                (let [{:strs [limit experiment_id template_id aws_worker_id]
                       :or   {limit "250"}} (:query-params ctx)
                      max-limit (min (as-long limit) 1000)]
                  (Response/all-where max-limit experiment_id template_id aws_worker_id)))
   :post! (fn [ctx]
            (let [{:keys [body query-params]} ctx
                  {:strs [block_id data assignment_id]} body
                  {:strs [participant_id aws_worker_id]} query-params
                  participant (find-or-create-participant! participant_id aws_worker_id)]
              (when (nil? participant) (throw (Exception. "No matching participant found")))
              (Response/insert! {:participant_id (:id participant)
                                 :block_id block_id
                                 :data data
                                 :assignment_id assignment_id})))})

(def response
  {:available-media-types ["application/json"]
   :initialize-context #(get-in % [:request :route-params])
   :allowed-methods [:get]
   :exists? (fn [ctx]
              (when-let [response (Response/find-by-id (get ctx :id))]
                {:record response}))
   :handle-ok :record})

(def templates
  "TODO: when inserting, if we incur a 'duplicate key value violates unique constraint' exception,
  redirect with HTTP 303 ('See other'), including a Location header to the existing template,
  and set the response to 'Template already exists'"
  (resource-list ::resources/template Template/all Template/insert!))

(def template
  ; TODO: maybe set a caching header like (header res "Cache-Control" "max-age=5")
  (resource-record ::resources/template :id
                   Template/find-by-id
                   Template/update!))

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
