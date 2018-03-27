(ns formious.store)

(defonce ^{:doc "Global application state for admin UI"} app-state
  (atom {:route nil}))

(defmulti dispatch!
  "Update `app-state` by handling `action`. E.g.:

      (dispatch! (actions/select ::resources/template))
      (dispatch! (actions/select ::resources/template {:id 1}))

      (dispatch! (actions/insert! ::resources/template {:name \"Empty template\" :html html}})

      (dispatch! (actions/update! ::resources/template {:name \"Fixed template\"} {:id 1}))
      (dispatch! (actions/update! ::resources/template {:id 1 :name \"Fixed template\"}))

      (dispatch! (actions/delete! ::resources/template {:id 1}))
  "
  (fn [action]
    {:pre [(contains? action :type)]}
    (:type action)))
