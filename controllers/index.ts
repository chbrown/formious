import * as path from 'path'
import * as send from 'send'
import Router from 'regex-router'

import * as httpUtil from '../http-util'

// sub-controllers
import api from './api'
import experiments from './experiments'
import login from './login'
import mturk from './mturk'
import util from './util'

const R = new Router()

R.get(/^\/(admin|$)/, (req, res) => {
  req.url = '/ui/index.html'
  R.route(req, res)
})

// attach controllers
R.any(/^\/api/, api)
R.any(/^\/experiments/, experiments)
R.any(/^\/login/, login)
R.any(/^\/mturk/, mturk)
R.any(/^\/util/, util)

const UI_ROOT = path.join(__dirname, '..', 'ui')

R.get(/^\/ui\/([^?]+)(\?|$)/, (req, res, m) => {
  send(req, m[1], {root: UI_ROOT})
  .on('error', (err) => {
    httpUtil.writeError(res, err)
  })
  .on('directory', () => {
    res.statusCode = 404
    httpUtil.writeError(res, new Error(`No resource at: ${req.url}`))
  })
  .pipe(res)
})

R.get(/^\/info$/, (req, res) => {
  const package_json = require('../package.json')
  const info = {
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
    homepage: package_json.homepage,
    author: package_json.author,
    license: package_json.license,
  }
  httpUtil.writeJson(res, info)
})

R.get(/^\/echo$/, (req, res) => {
  httpUtil.writeJson(res, {
    httpVersion: req.httpVersion,
    url: req.url,
    method: req.method,
    headers: req.headers,
    trailers: req.trailers,
    connection: {
      remoteAddress: req.connection.remoteAddress,
    },
  })
})

export default R.route.bind(R)
