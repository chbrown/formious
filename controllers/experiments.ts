import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import * as async from 'async'
import * as stream from 'stream'
import * as handlebars from 'handlebars'
import {logger} from 'loge'
import * as streamingJSON from 'streaming/json'
import * as sv from 'sv'
import Router from 'regex-router'
import * as url from 'url'

import db from '../db'
import * as httpUtil from '../http-util'
import AccessToken from '../models/AccessToken'
import Block from '../models/Block'
import Experiment from '../models/Experiment'
import Participant from '../models/Participant'
import Template from '../models/Template'

/**
Return a WritableStream, which we will generally pipe into res, and then
successively write() to, eventually calling end(), or pipe to from another stream.

Handles ?accept= querystring values as well as Accept: headers, deferring to
the querystring, and defaults to line-delimited JSON
*/
function createAdaptiveTransform(accept: string): stream.Transform & {contentType: string} {
  // set empty contentType and no-op stream
  let contentType: string
  // set default to streaming/json.Stringifier() so that we don't trip up on
  // "TypeError: Invalid non-string/buffer chunk" exceptions when trying to write
  // an object to the default writer
  let writableStream: stream.Transform = new streamingJSON.Stringifier()
  // now check that header against the accept values we support
  if (/application\/json;\s*boundary=(NL|LF|EOL)/.test(accept)) {
    contentType = 'application/json; boundary=LF'
    writableStream = new streamingJSON.Stringifier()
  }
  else if (/application\/json/.test(accept)) {
    contentType = 'application/json'
    writableStream = new streamingJSON.ArrayStringifier()
  }
  else if (/text\/csv/.test(accept)) {
    contentType = 'text/csv; charset=utf-8'
    writableStream = new sv.Stringifier({peek: 100})
  }
  else if (/text\/plain/.test(accept)) {
    contentType = 'text/plain; charset=utf-8'
    writableStream = new sv.Stringifier({peek: 100})
  }
  else {
    logger.info('Cannot find writer for Accept value: %j; using default', accept)
  }
  return Object.assign(writableStream, {contentType})
}

let cachedBlockTemplate: HandlebarsTemplateDelegate // a Handlebars template function
function getBlockTemplate(callback: (error: Error, template?: HandlebarsTemplateDelegate) => void): void {
  if (cachedBlockTemplate) {
    callback(null, cachedBlockTemplate)
  }
  else {
    const block_template_filepath = path.join(__dirname, '..', 'public', 'block.html')
    fs.readFile(block_template_filepath, {encoding: 'utf8'}, (err, block_template) => {
      if (err) return callback(err)
      cachedBlockTemplate = handlebars.compile(block_template)
      callback(null, cachedBlockTemplate)
    })
  }
}

const R = new Router()

/**
The Amazon Mechanical Turk frame will give us the following variables:

  https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
     &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
     &hitId=123RVWYBAZW00EXAMPLE
     &turkSubmitTo=https://www.mturk.com
     &workerId=AZ3456EXAMPLE
*/

/** GET /experiments/:experiment_id
Redirect to first block of experiment
*/
R.get(/^\/experiments\/(\d+)(\?|$)/, (req, res, m) => {
  const experiment_id = m[1]

  db.SelectOne('blocks')
  .where('experiment_id = ?', experiment_id)
  .orderBy('view_order ASC')
  .execute((err, block) => {
    if (err) return httpUtil.writeError(res, err)
    if (!block) return httpUtil.writeError(res, new Error('No available blocks'))

    const urlObj = url.parse(req.url, true)
    urlObj.pathname = `/experiments/${experiment_id}/blocks/${block.id}`
    const block_url = url.format(urlObj)

    httpUtil.writeRedirect(res, block_url, 302)
  })
})

/** GET /experiments/:experiment_id/blocks/:block_id
Render block as html
*/
R.get(/^\/experiments\/(\d+)\/blocks\/(\d+)(\?|$)/, (req, res, m) => {
  const [, experiment_id, block_id] = m

  async.auto<{experiment?: Experiment, block?: Block, template?: Template}, Error>({
    experiment: (callback) => {
      db.SelectOne('experiments')
      .whereEqual({id: experiment_id})
      .execute(callback)
    },
    block: (callback) => {
      db.SelectOne('blocks')
      .whereEqual({id: block_id})
      .execute(callback)
    },
    template: ['block', (results, callback) => {
      db.SelectOne('templates')
      .whereEqual({id: results.block.template_id})
      .execute(callback)
    }],
  }, Infinity, (err, results) => {
    if (err) return httpUtil.writeError(res, err)

    // block_globals is given to all blocks, in case they want the values.
    // it's mostly metadata, compared to the states.
    const urlObj = url.parse(req.url, true)

    // check if we somehow requested a parent (non-leaf) block (with no template)
    if (!results.template) {
      // in which case, we must stop and redirect
      const aws_worker_id = httpUtil.asString(urlObj.query.workerId) || 'WORKER_ID_NOT_AVAILABLE'
      return Participant.findOrCreate({aws_worker_id}, (err, participant) => {
        if (err) return httpUtil.writeError(res, err)

        return Block.nextBlockId(experiment_id, parseInt(block_id, 10), participant.id, (err, next_block_id) => {
          if (err) return httpUtil.writeError(res, err)

          const pathname = `/experiments/${experiment_id}/blocks/${next_block_id}`
          httpUtil.writeRelativeRedirect(res, req, {pathname})
        })
      })
    }

    // context: the current state to render the template with
    // urlObj.query will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    const context = {...results.block.context, ...urlObj.query, experiment_id, block_id}

    // need a better default for missing html
    const template_html = results.template.html
    let rendered_html = template_html
    try {
      rendered_html = handlebars.compile(template_html)(context)
    }
    catch (exc) {
      logger.error('Error compiling template markup', exc)
    }

    getBlockTemplate((err, block_template) => {
      if (err) return httpUtil.writeError(res, err)

      const block_html = block_template({
        context: JSON.stringify(context).replace(/<\//g, '<\\/'),
        header: results.experiment.html,
        html: rendered_html,
      })
      httpUtil.writeHtml(res, block_html)
    })
  })
})

/** POST /experiments/:experiment_id/blocks/:block_id

Save response
*/
R.post(/^\/experiments\/(\d+)\/blocks\/(\d+)(\?|$)/, (req, res, m) => {
  const experiment_id = parseInt(m[1], 10)
  const block_id = parseInt(m[2], 10)
  const urlObj = url.parse(req.url, true)
  const aws_worker_id = httpUtil.asString(urlObj.query.workerId) || 'WORKER_ID_NOT_AVAILABLE'

  httpUtil.readData(req, (err, value) => {
    if (err) return httpUtil.writeError(res, err)

    const ip_address = httpUtil.readIPAddress(req)
    const user_agent = httpUtil.readUserAgent(req)

    Participant.addResponse({aws_worker_id, ip_address, user_agent},
                            {block_id, value},
                            (err, participant /*, responses*/) => {
      if (err) return httpUtil.writeError(res, err)

      Block.nextBlockId(experiment_id, block_id, participant.id, (err, next_block_id) => {
        if (err) return httpUtil.writeError(res, err)
        logger.info('Block.nextBlockId: %j', next_block_id)

        // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
        // sadly, this redirect_to doesn't work. Hopefully the user will have a proper
        // POST-to-MT form in their last block
        // const redirect_to = `${urlObj.query.turkSubmitTo}/mturk/externalSubmit?assignmentId=${urlObj.query.assignmentId}`
        if (next_block_id === null) {
          // meaning, there are no more blocks to complete
          return httpUtil.writeText(res, 'You have already completed all available blocks in this experiment.')
        }

        // only change the path part of the url
        const pathname = `/experiments/${experiment_id}/blocks/${next_block_id}`
        httpUtil.writeRelativeRedirect(res, req, {pathname})
      })
    })
  })
})

/** GET /experiments/:experiment_id/responses?token=ABCDEF12345

Requires authorization, but only by access token.
Show only the responses that reference this Experiment. */
R.get(/^\/experiments\/(\d+)\/responses(\?|$)/, (req, res, m) => {
  const experiment_id = parseInt(m[1], 10)

  const urlObj = url.parse(req.url, true)
  const token = httpUtil.asString(urlObj.query.token)
  AccessToken.check(token, 'experiments', experiment_id, (err) => {
    if (err) return httpUtil.writeError(res, err)

    // yay, authorization granted

    db.Select('responses, participants, blocks')
    .where('participants.id = responses.participant_id')
    .where('blocks.id = responses.block_id')
    .add('responses.*', 'blocks.context', 'blocks.experiment_id', 'participants.name', 'participants.aws_worker_id')
    .whereEqual({experiment_id})
    .orderBy('responses.id DESC')
    .execute((err, responses) => {
      if (err) return httpUtil.writeError(res, err)

      const accept = httpUtil.asString(urlObj.query.accept) || req.headers.accept || 'application/json; boundary=LF'
      const writer = createAdaptiveTransform(accept)
      if (writer.contentType) {
        res.setHeader('Content-Type', writer.contentType)
      }
      writer.pipe(res)
      responses.forEach((response) => {
        const response_object = {
          response_id: response.id,
          participant_id: response.participant_id,
          participant_name: response.name || response.aws_worker_id,
          experiment_id: response.experiment_id,
          block_id: response.block_id,
          created: response.created,
        }
        // merge those static values with the dynamic context and value objects
        const row = {...response.context, ...response_object, ...response.value}
        writer.write(row)
      })
      writer.end()
    })
  })
})

export default R.route.bind(R)
