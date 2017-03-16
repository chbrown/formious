(ns formious.routes.api
  (:require [formious.routes.api.access-tokens]
            [formious.routes.api.administrators]
            [formious.routes.api.aws-accounts]
            [formious.routes.api.experiments]
            [formious.routes.api.mturk]
            [formious.routes.api.responses]
            [formious.routes.api.templates]
            [compojure.core :refer [defroutes context]]))

; use Liberator? http://clojure-liberator.github.io/liberator/tutorial/getting-started.html

(defroutes routes
  (context "/access_tokens" [] formious.routes.api.access-tokens/routes)
  (context "/administrators" [] formious.routes.api.administrators/routes)
  (context "/aws_accounts" [] formious.routes.api.aws-accounts/routes)
  (context "/experiments" [] formious.routes.api.experiments/routes)
  (context "/mturk" [] formious.routes.api.mturk/routes)
  (context "/responses" [] formious.routes.api.responses/routes)
  (context "/templates" [] formious.routes.api.templates/routes))
