import * as _ from 'lodash'
import Router from 'regex-router'

import db from '../../db'
import * as httpUtil from '../../http-util'
import Template, {Row as TemplateRow} from '../../models/Template'

const R = new Router()

/** GET /api/templates
List all templates. */
R.get(/^\/api\/templates$/, (req, res) => {
  db.Select('templates')
  .orderBy('id ASC')
  .execute((err, templates) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, templates)
  })
})

/** GET /api/templates/new
Generate blank template. */
R.get(/^\/api\/templates\/new$/, (req, res) => {
  httpUtil.writeJson(res, {html: '', created: new Date()})
})

/** POST /api/templates
Create new template. */
R.post(/^\/api\/templates$/, (req, res) => {
  httpUtil.readFields<TemplateRow>(req, Template.columns, (err, fields) => {
    if (err) return httpUtil.writeError(res, err)

    db.InsertOne('templates')
    .set(fields)
    .returning('*')
    .execute((err, template) => {
      if (err) {
        if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
          // 303 is a "See other" and SHOULD include a Location header
          res.statusCode = 303
          return httpUtil.writeError(res, new Error('Template already exists'))
        }
        return httpUtil.writeError(res, err)
      }
      res.statusCode = 201
      httpUtil.writeJson(res, template)
    })
  })
})

/** GET /api/templates/:id
Show existing template. */
R.get(/^\/api\/templates\/(\d+)$/, (req, res, m) => {
  db.SelectOne('templates')
  .whereEqual({id: m[1]})
  .execute((err, template) => {
    if (err) return httpUtil.writeError(res, err)

    res.setHeader('Cache-Control', 'max-age=5')
    httpUtil.writeJson(res, template)
  })
})

/** POST /api/templates/:id
Update existing template. */
R.post(/^\/api\/templates\/(\d+)/, (req, res, m) => {
  httpUtil.readFields<TemplateRow>(req, Template.columns, (err, fields) => {
    if (err) return httpUtil.writeError(res, err)

    db.Update('templates')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute((err) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 204
      res.end() // 204 No Content
    })
  })
})

/** DELETE /api/templates/:id
Delete existing template. */
R.delete(/^\/api\/templates\/(\d+)$/, (req, res, m) => {
  db.Delete('templates')
  .whereEqual({id: m[1]})
  .execute((err) => {
    if (err) return httpUtil.writeError(res, err)

    res.statusCode = 204
    res.end()
  })
})

export default R.route.bind(R)
