(ns formious.client.state)

(defonce app-state (atom {:route nil
                          :text "Hello world!"}))
