import Router from 'regex-router'
import {IncomingMessage, ServerResponse} from 'http'
import Cookies from 'cookies'

import * as httpUtil from '../../http-util'
import Administrator from '../../models/Administrator'

// sub-controllers
import access_tokens from './access_tokens'
import administrators from './administrators'
import aws_accounts from './aws_accounts'
import experiments from './experiments'
import mturk from './mturk'
import responses from './responses'
import templates from './templates'

const R = new Router()

R.any(/^\/api\/access_tokens/, access_tokens)
R.any(/^\/api\/administrators/, administrators)
R.any(/^\/api\/aws_accounts/, aws_accounts)
R.any(/^\/api\/experiments/, experiments)
R.any(/^\/api\/mturk/, mturk)
R.any(/^\/api\/responses/, responses)
R.any(/^\/api\/templates/, templates)

function prerouter(req: IncomingMessage, res: ServerResponse) {
  // handle auth and forward. this is the checkpoint for all admin-level
  // requests, and should return 401 (to be handled by the client) for all
  // non-administrators
  const cookies = new Cookies(req, res)
  const token = cookies.get('administrator_token')
  Administrator.fromToken(token, (err, administrator) => {
    if (err) {
      res.statusCode = 401
      return httpUtil.writeError(res, new Error('Authorization failed; you must login first.'))
    }
    else {
      // authentication succeeded! they're in. go wild.
      // attach administrator object to the request payload
      req['administrator'] = administrator
      R.route(req, res)
    }
  })
}

export default prerouter
