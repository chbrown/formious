import Router from 'regex-router'
import * as Cookies from 'cookies'
import * as moment from 'moment'
import {logger} from 'loge'

import * as httpUtil from '../http-util'
import Administrator from '../models/Administrator'

// router & actions for logging in
const R = new Router()

/** POST /login
Try to login as user with email and password */
R.post(/^\/login$/, function(req, res) {
  httpUtil.readData(req, function(err, fields) {
    if (err) return httpUtil.writeError(res, err)

    // artificially slow to deflect brute force attacks
    setTimeout(function() {
      Administrator.authenticate(fields.email, fields.password, function(err, token) {
        if (err) {
          // we serve the login page from GET as well as failed login POSTs
          res.statusCode = 401
          return httpUtil.writeJson(res, {message: err.toString()})
        }

        var message = 'Authenticated successfully'
        logger.info('%s; token = %s', message, token)

        var cookies = new Cookies(req, res)
        cookies.set('administrator_token', token, {
          path: '/',
          expires: moment().add(1, 'month').toDate(),
        })

        httpUtil.writeJson(res, {message: message})
      })
    }, 500)
  })
})

export default R.route.bind(R)
