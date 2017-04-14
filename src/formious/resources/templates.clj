(ns formious.resources.templates
  (:require [formious.db.template :as Template]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [resource-list resource-record]]))

; thanks, https://github.com/juxt/bidi/issues/95
; https://clojure-liberator.github.io/liberator/tutorial/all-together.html
; also good (albeit old) regarding REST in liberator:
;   https://github.com/clojure-liberator/liberator/issues/6

; if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
;   ; 303 is a "See other" and SHOULD include a Location header
;   return res.status(303).die('Template already exists')
; }
(defresource templates (resource-list Template/writable-columns
                                      Template/all
                                      Template/insert!))

  ; (header "Cache-Control", "max-age=5") ?
  ; :handle-ok (fn [{:keys [::template]}] (println "template/handle-ok" template) template)
(defresource template (resource-record Template/writable-columns
                                       Template/blank
                                       Template/find-by-id
                                       Template/update!
                                       Template/delete!))
