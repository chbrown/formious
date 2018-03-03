var Participant = require('../models/Participant')
var Router = require('regex-router')

var R = new Router()

/**
POST /mturk/externalSubmit

This is a testing filler for the MTurk production / sandbox final POST, which
will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
parameter to the given URL, but if that's missing, it'll be evaluated as the
empty string, and so missing final post backs will hit this endpoint.
*/
R.post(/^\/mturk\/externalSubmit/, function(req, res) {
  // readData uses the querystring for GET data
  req.readData(function(err, data) {
    var aws_worker_id = data.workerId || 'WORKER_ID_NOT_AVAILABLE'
    delete data.workerId

    // potentially null block_id
    var block_id = data.block_id || null
    delete data.block_id

    Participant.addResponse({
      aws_worker_id: aws_worker_id,
      ip_address: req.headers['x-real-ip'] || req.client.remoteAddress,
      user_agent: req.headers['user-agent'],
    }, {
      block_id: block_id,
      value: data,
    }, function(err) {
      if (err) return res.die(err)

      res.text('Your responses have been submitted and saved.')
    })
  })
})

module.exports = R.route.bind(R)
