import * as _ from 'lodash'
import Router from 'regex-router'

import db from '../../db'
import * as httpUtil from '../../http-util'
import AccessToken from '../../models/AccessToken'

const R = new Router()

/** GET /api/access_tokens
List all access tokens. */
R.get(/^\/api\/access_tokens$/, function(req, res) {
  db.Select('access_tokens')
  .orderBy('id ASC')
  .execute(function(err, access_tokens) {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, access_tokens)
  })
})

/** GET /api/access_tokens/new
Generate blank access token. */
R.get(/^\/api\/access_tokens\/new$/, function(req, res) {
  httpUtil.writeJson(res, {})
})

/** POST /api/access_tokens
Create new access token. */
R.post(/^\/api\/access_tokens$/, function(req, res) {
  httpUtil.readData(req, (err, data) => {
    if (err) return httpUtil.writeError(res, err)

    var fields = _.pick(data, AccessToken.columns)

    db.InsertOne('access_tokens')
    .set(fields)
    .returning('*')
    .execute(function(err, access_token) {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 201
      httpUtil.writeJson(res, access_token)
    })
  })
})

/** GET /api/access_tokens/:id
Show existing access token. */
R.get(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  db.SelectOne('access_tokens')
  .whereEqual({id: m[1]})
  .execute(function(err, access_token) {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, access_token)
  })
})

/** POST /api/access_tokens/:id
Update existing access token. */
R.post(/^\/api\/access_tokens\/(\d+)/, function(req, res, m) {
  httpUtil.readData(req, function(err, data) {
    if (err) return httpUtil.writeError(res, err)

    var fields = _.pick(data, AccessToken.columns)

    db.Update('access_tokens')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 204
      res.end() // 204 No Content
    })
  })
})

/** DELETE /api/access_tokens/:id
Delete existing access token. */
R.delete(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  db.Delete('access_tokens')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return httpUtil.writeError(res, err)

    res.statusCode = 204
    res.end()
  })
})

export default R.route.bind(R)
