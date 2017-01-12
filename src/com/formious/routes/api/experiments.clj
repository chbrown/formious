(ns com.formious.routes.api.experiments
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.experiments :as Experiment]
            [com.formious.routes.api.experiment.blocks]
            [compojure.core :refer [GET PATCH POST PUT DELETE context defroutes]]))

(defroutes routes
  (context "/experiments" [] com.formious.routes.api.experiment.blocks/routes)
  (GET "/" []
    ; experiments.foreach { experiment => Experiment.findOrCreateAccessToken(experiment.id) }
    (Experiment/all))
  (GET "/new" []
    (Experiment/empty))
  (POST "/" {{:strings [name, administrator_id, html]} :body}
    (-> (Experiment/create name, administrator_id, html) (created)))
  (GET "/:id" [id :<< as-int]
    ;Experiment.findOrCreateAccessToken(experiment.id)
    ;NotFound(new Exception("Experiment not found"))
    (Experiment/find id))
  (POST "/:id" [id :<< as-int :as {{:strings [name, administrator_id, html]} :body}]
    (Experiment/update id name, administrator_id, html)
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (Experiment/delete id)
    (no-content)))
