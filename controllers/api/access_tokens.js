var _ = require('lodash')
var db = require('../../db')
var AccessToken = require('../../models/AccessToken')
var Router = require('regex-router')

var R = new Router()

/** GET /api/access_tokens
List all access tokens. */
R.get(/^\/api\/access_tokens$/, function(req, res) {
  db.Select('access_tokens')
  .orderBy('id ASC')
  .execute(function(err, access_tokens) {
    if (err) return res.die(err)
    res.json(access_tokens)
  })
})

/** GET /api/access_tokens/new
Generate blank access token. */
R.get(/^\/api\/access_tokens\/new$/, function(req, res) {
  res.json({})
})

/** POST /api/access_tokens
Create new access token. */
R.post(/^\/api\/access_tokens$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    var fields = _.pick(data, AccessToken.columns)

    db.InsertOne('access_tokens')
    .set(fields)
    .returning('*')
    .execute(function(err, access_token) {
      if (err) return res.die(err)
      res.status(201).json(access_token)
    })
  })
})

/** GET /api/access_tokens/:id
Show existing access token. */
R.get(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  db.SelectOne('access_tokens')
  .whereEqual({id: m[1]})
  .execute(function(err, access_token) {
    if (err) return res.die(err)

    res.json(access_token)
  })
})

/** POST /api/access_tokens/:id
Update existing access token. */
R.post(/^\/api\/access_tokens\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    var fields = _.pick(data, AccessToken.columns)

    db.Update('access_tokens')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.die(err)
      res.status(204).end() // 204 No Content
    })
  })
})

/** DELETE /api/access_tokens/:id
Delete existing access token. */
R.delete(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  db.Delete('access_tokens')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return res.die(err)
    res.status(204).end()
  })
})

module.exports = R.route.bind(R)
