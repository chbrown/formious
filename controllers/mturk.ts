import Participant from '../models/Participant'
import Router from 'regex-router'

import * as httpUtil from '../http-util'

const R = new Router()

/**
POST /mturk/externalSubmit

This is a testing filler for the MTurk production / sandbox final POST, which
will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
parameter to the given URL, but if that's missing, it'll be evaluated as the
empty string, and so missing final post backs will hit this endpoint.
*/
R.post(/^\/mturk\/externalSubmit/, (req, res) => {
  // readData uses the querystring for GET data
  httpUtil.readData(req, (err, value) => {
    const aws_worker_id: string = value.workerId || 'WORKER_ID_NOT_AVAILABLE'
    delete value.workerId

    // potentially null block_id
    const block_id = value.block_id || null
    delete value.block_id

    const ip_address = httpUtil.readIPAddress(req)
    const user_agent = httpUtil.readUserAgent(req)
    Participant.addResponse({aws_worker_id, ip_address, user_agent}, {block_id, value}, (err) => {
      if (err) return httpUtil.writeError(res, err)

      httpUtil.writeText(res, 'Your responses have been submitted and saved.')
    })
  })
})

export default R.route.bind(R)
