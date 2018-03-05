import * as _ from 'lodash'
import * as url from 'url'
import Router from 'regex-router'

import db from '../../db'
import * as httpUtil from '../../http-util'
import Participant from '../../models/Participant'

const R = new Router()

/**
GET /api/responses
*/
R.get(/^\/api\/responses(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true)
  var limitString = String(urlObj.query.limit) || '250'

  // set a maximum limit at 1000, but default it to 250
  var limit = Math.min(parseInt(limitString, 10), 1000)

  var select = db.Select('responses, participants, blocks')
  .where('participants.id = responses.participant_id')
  .where('blocks.id = responses.block_id')
  .add(
    '*',
    // 'id' and 'created' from the other tables conflict with responses
    'responses.id AS id',
    'responses.created AS created',
    // count how many responses there are in all (i.e., outside the LIMIT)
    'COUNT(responses.id) OVER() AS count')
  .orderBy('responses.created DESC')
  .limit(limit)

  if (urlObj.query.experiment_id) {
    select = select.whereEqual({experiment_id: urlObj.query.experiment_id})
  }
  if (urlObj.query.template_id) {
    select = select.whereEqual({template_id: urlObj.query.template_id})
  }
  if (urlObj.query.aws_worker_id) {
    select = select.whereEqual({aws_worker_id: urlObj.query.aws_worker_id})
  }

  select.execute(function(err, responses) {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, responses)
  })
})

/**
GET /api/responses/:id
*/
R.get(/^\/api\/responses\/(\d+)$/, function(req, res, m) {
  db.SelectOne('responses')
  .whereEqual({id: m[1]})
  .execute(function(err, response) {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, response)
  })
})

/**
POST /api/responses
*/
R.post(/^\/api\/responses$/, function(req, res) {
  httpUtil.readData(req, function(err, data) {
    if (err) return httpUtil.writeError(res, err)

    var response = _.pick(data, ['participant_id', 'block_id', 'value', 'assignment_id'])

    Participant.addResponse({
      aws_worker_id: data.aws_worker_id,
    }, response, function(err, participant, response) {
      if (err) return httpUtil.writeError(res, err)

      httpUtil.writeJson(res, response)
    })
  })
})

export default R.route.bind(R)
