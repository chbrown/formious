(ns formious.store)

(defonce ^{:doc "Global application state for admin UI"} app-state
  (atom {:route nil}))
