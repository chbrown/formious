import * as _ from 'lodash'
import Router from 'regex-router'

import db from '../../db'
import * as httpUtil from '../../http-util'
import Administrator from '../../models/Administrator'

const R = new Router()

/** GET /api/administrators
List all administrators. */
R.get(/^\/api\/administrators$/, (req, res) => {
  db.Select('administrators')
  .orderBy('created DESC')
  .execute((err, administrators) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, administrators)
  })
})

/** GET /api/administrators/new

Generate blank administrator. */
R.get(/^\/api\/administrators\/new$/, (req, res) => {
  httpUtil.writeJson(res, {created: new Date()})
})

/** POST /api/administrators

Create new administrator. */
R.post(/^\/api\/administrators$/, (req, res) => {
  httpUtil.readData(req, (err, data) => {
    if (err) return httpUtil.writeError(res, err)

    // .add is like .insert, but hashes the password.
    Administrator.add(data.email, data.password, (err, administrator) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 201
      httpUtil.writeJson(res, administrator)
    })
  })
})

/** GET /api/administrators/:id

Show existing administrator. */
R.get(/^\/api\/administrators\/(\d+)$/, (req, res, m) => {
  db.SelectOne('administrators')
  .whereEqual({id: m[1]})
  .execute((err, full_administrator) => {
    if (err) return httpUtil.writeError(res, err)

    const administrator = _.omit(full_administrator, 'password')
    httpUtil.writeJson(res, administrator)
  })
})

/** POST /api/administrators/:id

Update existing administrator. */
R.post(/^\/api\/administrators\/(\d+)$/, (req, res, m) => {
  httpUtil.readData(req, (err, data) => {
    if (err) return httpUtil.writeError(res, err)

    const administrator = new Administrator({id: m[1]})
    // Administrator#update is like db.Update('administrators') but hashes the password if it is not ''
    administrator.update(data.email, data.password, (err) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 204
      res.end() // 204 No Content
    })
  })
})

/** DELETE /api/administrators/:administrator_id

Delete single administrator */
R.delete(/^\/api\/administrators\/(\d+)$/, (req, res, m) => {
  db.Delete('administrators')
  .whereEqual({id: m[1]})
  .execute((err) => {
    if (err) return httpUtil.writeError(res, err)

    res.statusCode = 204
    res.end()
  })
})

// Administrator-AWS Account many2many relationship

/** GET /api/administrators/:administrator_id/aws_accounts

List administrator-AWS accounts linked to this administrator */
R.get(/^\/api\/administrators\/(\d+)\/aws_accounts$/, (req, res, m) => {
  db.Select('aws_account_administrators, aws_accounts')
  .where('aws_account_administrators.aws_account_id = aws_accounts.id')
  .where('aws_account_administrators.administrator_id = ?', m[1])
  .orderBy('aws_account_administrators.priority DESC')
  .execute((err, rows) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, rows)
  })
})

/** POST /api/administrators/:administrator_id/aws_accounts/:aws_account_id

Create administrator-AWS account link */
R.post(/^\/api\/administrators\/(\d+)\/aws_accounts\/(\d+)$/, (req, res, m) => {
  httpUtil.readData(req, (err, data) => {
    db.InsertOne('aws_account_administrators')
    .set({
      administrator_id: m[1],
      aws_account_id: m[2],
      priority: data.priority,
    })
    .execute((err, aws_account_administrator) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 201
      httpUtil.writeJson(res, aws_account_administrator)
    })
  })
})

/** DELETE /api/administrators/:administrator_id/aws_accounts/:aws_account_id

Delete administrator-AWS account link */
R.delete(/^\/api\/administrators\/(\d+)\/aws_accounts\/(\d+)$/, (req, res, m) => {
  db.Delete('aws_account_administrators')
  .where('administrator_id = ?', m[1])
  .where('aws_account_id = ?', m[2])
  .execute((err) => {
    if (err) return httpUtil.writeError(res, err)

    // httpUtil.writeJson(res, {message: 'Disowned AWS account.'})
    res.statusCode = 204
    res.end()
  })
})

export default R.route.bind(R)
