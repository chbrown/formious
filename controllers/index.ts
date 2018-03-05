import * as path from 'path'
import * as send from 'send'
import Router from 'regex-router'

import * as httpUtil from '../http-util'

const R = new Router()

R.get(/^\/(admin|$)/, function(req, res) {
  req.url = '/ui/index.html'
  R.route(req, res)
})

// attach controllers
R.any(/^\/api/, require('./api'))
R.any(/^\/experiments/, require('./experiments'))
R.any(/^\/login/, require('./login'))
R.any(/^\/mturk/, require('./mturk'))
R.any(/^\/util/, require('./util'))

var UI_ROOT = path.join(__dirname, '..', 'ui')

R.get(/^\/ui\/([^?]+)(\?|$)/, function(req, res, m) {
  send(req, m[1], {root: UI_ROOT})
  .on('error', function(err) {
    httpUtil.writeError(res, err)
  })
  .on('directory', function() {
    res.statusCode = 404
    httpUtil.writeError(res, new Error('No resource at: ' + req.url))
  })
  .pipe(res)
})

R.get(/^\/info$/, function(req, res) {
  var package_json = require('../package.json')
  var info = {
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
    homepage: package_json.homepage,
    author: package_json.author,
    license: package_json.license,
  }
  httpUtil.writeJson(res, info)
})

R.get(/^\/echo$/, function(req, res) {
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
