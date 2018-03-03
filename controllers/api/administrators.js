var _ = require('lodash')
var Router = require('regex-router')

var Administrator = require('../../models/Administrator')
var db = require('../../db')

var R = new Router()

/** GET /api/administrators
List all administrators. */
R.get(/^\/api\/administrators$/, function(req, res) {
  db.Select('administrators')
  .orderBy('created DESC')
  .execute(function(err, administrators) {
    if (err) return res.die(err)
    res.json(administrators)
  })
})

/** GET /api/administrators/new

Generate blank administrator. */
R.get(/^\/api\/administrators\/new$/, function(req, res) {
  res.json({created: new Date()})
})

/** POST /api/administrators

Create new administrator. */
R.post(/^\/api\/administrators$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    // .add is like .insert, but hashes the password.
    Administrator.add(data.email, data.password, function(err, administrator) {
      if (err) return res.die(err)
      res.status(201).json(administrator)
    })
  })
})

/** GET /api/administrators/:id

Show existing administrator. */
R.get(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  db.SelectOne('administrators')
  .whereEqual({id: m[1]})
  .execute(function(err, full_administrator) {
    if (err) return res.die(err)
    var administrator = _.omit(full_administrator, 'password')
    res.json(administrator)
  })
})

/** POST /api/administrators/:id

Update existing administrator. */
R.post(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    var administrator = new Administrator({id: m[1]})
    // Administrator#update is like db.Update('administrators') but hashes the password if it is not ''
    administrator.update(data.email, data.password, function(err) {
      if (err) return res.die(err)
      res.status(204).end() // 204 No Content
    })
  })
})

/** DELETE /api/administrators/:administrator_id

Delete single administrator */
R.delete(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  db.Delete('administrators')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return res.die(err)
    res.status(204).end()
  })
})

// Administrator-AWS Account many2many relationship

/** GET /api/administrators/:administrator_id/aws_accounts

List administrator-AWS accounts linked to this administrator */
R.get(/^\/api\/administrators\/(\d+)\/aws_accounts$/, function(req, res, m) {
  db.Select('aws_account_administrators, aws_accounts')
  .where('aws_account_administrators.aws_account_id = aws_accounts.id')
  .where('aws_account_administrators.administrator_id = ?', m[1])
  .orderBy('aws_account_administrators.priority DESC')
  .execute(function(err, rows) {
    if (err) return res.die(err)
    res.json(rows)
  })
})

/** POST /api/administrators/:administrator_id/aws_accounts/:aws_account_id

Create administrator-AWS account link */
R.post(/^\/api\/administrators\/(\d+)\/aws_accounts\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    db.InsertOne('aws_account_administrators')
    .set({
      administrator_id: m[1],
      aws_account_id: m[2],
      priority: data.priority,
    })
    .execute(function(err, aws_account_administrator) {
      if (err) return res.die(err)
      res.status(201).json(aws_account_administrator)
    })
  })
})

/** DELETE /api/administrators/:administrator_id/aws_accounts/:aws_account_id

Delete administrator-AWS account link */
R.delete(/^\/api\/administrators\/(\d+)\/aws_accounts\/(\d+)$/, function(req, res, m) {
  db.Delete('aws_account_administrators')
  .where('administrator_id = ?', m[1])
  .where('aws_account_id = ?', m[2])
  .execute(function(err) {
    if (err) return res.die(err)
    // res.json({message: 'Disowned AWS account.'})
    res.status(204).end()
  })
})

module.exports = R.route.bind(R)
