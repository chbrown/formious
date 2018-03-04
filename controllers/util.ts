var Router = require('regex-router')
var streaming = require('streaming')
var sv = require('sv')

var excel = require('../lib/excel')

var R = new Router()

/** POST /util/parse-table

Parse csv-like input flexibly and write out json to response */
R.post(/\/util\/parse-table/, function(req, res) {
  var content_type = req.headers['content-type']
  if (content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    req.readToEnd(function(err, data) {
      if (err) return res.die(err)

      var objects = excel.parseXlsx(data)
      // var columns = _.chain(objects).map(_.keys).flatten().unique().value()
      // res.setHeader('X-Columns', columns)
      res.json(objects)
    })
  }
  else {
    // prepare transforms
    var parser = content_type == 'application/json' ? new streaming.json.Parser() : new sv.Parser()
    var stringifier = new streaming.json.ArrayStringifier()
    // set headers
    res.setHeader('content-type', 'application/json')
    // pipe all the streams together
    req.pipe(parser).pipe(stringifier).pipe(res)
  }
})

module.exports = R.route.bind(R)
