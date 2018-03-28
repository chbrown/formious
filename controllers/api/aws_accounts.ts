import * as _ from 'lodash'
import Router from 'regex-router'

import db from '../../db'
import * as httpUtil from '../../http-util'
import AWSAccount, {Row as AWSAccountRow} from '../../models/AWSAccount'

const R = new Router()

/** GET /api/aws_accounts
List all AWS accounts. */
R.get(/^\/api\/aws_accounts$/, (req, res) => {
  db.Select('aws_accounts')
  .orderBy('id ASC')
  .execute((err, aws_accounts) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, aws_accounts)
  })
})

/** GET /api/aws_accounts/new
Generate blank AWS account. */
R.get(/^\/api\/aws_accounts\/new$/, (req, res) => {
  httpUtil.writeJson(res, {})
})

/** POST /api/aws_accounts
Create new AWS account. */
R.post(/^\/api\/aws_accounts$/, (req, res) => {
  httpUtil.readFields<AWSAccountRow>(req, AWSAccount.columns, (err, fields) => {
    if (err) return httpUtil.writeError(res, err)

    db.InsertOne('aws_accounts')
    .set(fields)
    .returning('*')
    .execute((err, aws_account) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 201
      httpUtil.writeJson(res, aws_account)
    })
  })
})

/** GET /api/aws_accounts/:id
Show existing AWS account. */
R.get(/^\/api\/aws_accounts\/(\d+)$/, (req, res, m) => {
  db.SelectOne('aws_accounts')
  .whereEqual({id: m[1]})
  .execute((err, aws_account) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, aws_account)
  })
})

/** POST /api/aws_accounts/:id
Update existing AWS account. */
R.post(/^\/api\/aws_accounts\/(\d+)/, (req, res, m) => {
  httpUtil.readFields<AWSAccountRow>(req, AWSAccount.columns, (err, fields) => {
    if (err) return httpUtil.writeError(res, err)

    db.Update('aws_accounts')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute((err) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 204
      res.end() // 204 No Content
    })
  })
})

/** DELETE /api/aws_accounts/:id
Delete AWS account. */
R.delete(/^\/api\/aws_accounts\/(\d+)$/, (req, res, m) => {
  db.Delete('aws_accounts')
  .whereEqual({id: m[1]})
  .execute((err) => {
    if (err) return httpUtil.writeError(res, err)

    res.statusCode = 204
    res.end()
  })
})

export default R.route.bind(R)
