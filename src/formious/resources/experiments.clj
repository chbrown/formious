(ns formious.resources.experiments
  (:require [formious.db.experiment :as Experiment]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [resource-list resource-record]]))

(defresource experiments (resource-list Experiment/writable-columns
                                        ; experiments.foreach { experiment =>
                                        ;   Experiment.findOrCreateAccessToken(experiment.id) }
                                        Experiment/all
                                        Experiment/insert!))

(defresource experiment (resource-record Experiment/writable-columns
                                         Experiment/blank
                                         ;Experiment.findOrCreateAccessToken(experiment.id)
                                         Experiment/find-by-id
                                         Experiment/update!
                                         Experiment/delete!))
