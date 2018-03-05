import * as url from 'url'
import Router from 'regex-router'
import * as turk from 'turk'

import db from '../../db'
import * as httpUtil from '../../http-util'

const R = new Router()

/** POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'

The querystring should contain the aws_account.id and the target MTurk environment.
`aws_account_id` indicates a record in the AWS Account table, which exposes the
AWS Access Key ID and AWS Secret Access Key

The POST should contain, minimally, an "Operation" field, indicating the MTurk
API operation to call.
*/
R.post(/^\/api\/mturk\?/, function(req, res) {
  var urlObj = url.parse(req.url, true)
  var aws_account_id = urlObj.query.aws_account_id || null
  var environment = urlObj.query.environment == 'production' ? turk.Environment.production : turk.Environment.sandbox

  httpUtil.readData(req, function(err, data) {
    if (err) return httpUtil.writeError(res, err)

    db.SelectOne('aws_accounts')
    .whereEqual({id: aws_account_id})
    .execute(function(err, aws_account) {
      if (err) return httpUtil.writeError(res, err)
      if (!aws_account) return httpUtil.writeError(res, new Error('AWS Account Not Found'))

      var account = new turk.Account(aws_account.access_key_id, aws_account.secret_access_key)
      var connection = account.createConnection(environment)

      connection.post(data, function(err, xml) {
        if (err) return httpUtil.writeError(res, err)

        res.setHeader('Content-Type', 'text/xml')
        res.end(xml)
      })
    })
  })
})

export default R.route.bind(R)
