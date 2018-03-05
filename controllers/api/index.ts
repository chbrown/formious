import Router from 'regex-router'
import * as Cookies from 'cookies'

import * as httpUtil from '../../http-util'
import Administrator from '../../models/Administrator'

const R = new Router()

R.any(/^\/api\/access_tokens/, require('./access_tokens'))
R.any(/^\/api\/administrators/, require('./administrators'))
R.any(/^\/api\/aws_accounts/, require('./aws_accounts'))
R.any(/^\/api\/experiments/, require('./experiments'))
R.any(/^\/api\/mturk/, require('./mturk'))
R.any(/^\/api\/responses/, require('./responses'))
R.any(/^\/api\/templates/, require('./templates'))

function prerouter(req, res) {
  // handle auth and forward. this is the checkpoint for all admin-level
  // requests, and should return 401 (to be handled by the client) for all
  // non-administrators
  var cookies = new Cookies(req, res)
  var token = cookies.get('administrator_token')
  Administrator.fromToken(token, function(err, administrator) {
    if (err) {
      res.statusCode = 401
      return httpUtil.writeError(res, new Error('Authorization failed; you must login first.'))
    }
    else {
      // authentication succeeded! they're in. go wild.
      // attach administrator object to the request payload
      req.administrator = administrator
      R.route(req, res)
    }
  })
}

export default prerouter
