(ns com.formious.routes.api
  (:require [com.formious.routes.api.access-tokens]
            [com.formious.routes.api.administrators]
            [com.formious.routes.api.aws-accounts]
            [com.formious.routes.api.experiments]
            [com.formious.routes.api.mturk]
            [com.formious.routes.api.responses]
            [com.formious.routes.api.templates]
            [compojure.core :refer [defroutes context]]))

; use Liberator? http://clojure-liberator.github.io/liberator/tutorial/getting-started.html

(defroutes routes
  (context "/access_tokens" [] com.formious.routes.api.access-tokens/routes)
  (context "/administrators" [] com.formious.routes.api.administrators/routes)
  (context "/aws_accounts" [] com.formious.routes.api.aws-accounts/routes)
  (context "/experiments" [] com.formious.routes.api.experiments/routes)
  (context "/mturk" [] com.formious.routes.api.mturk/routes)
  (context "/responses" [] com.formious.routes.api.responses/routes)
  (context "/templates" [] com.formious.routes.api.templates/routes))
