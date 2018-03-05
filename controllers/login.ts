import Router from 'regex-router'
import Cookies from 'cookies'
import * as moment from 'moment'
import {logger} from 'loge'

import * as httpUtil from '../http-util'
import Administrator from '../models/Administrator'

// router & actions for logging in
const R = new Router()

/** POST /login
Try to login as user with email and password */
R.post(/^\/login$/, (req, res) => {
  httpUtil.readData(req, (err, fields: {email?: string, password?: string}) => {
    if (err) return httpUtil.writeError(res, err)

    // artificially slow to deflect brute force attacks
    setTimeout(() => {
      Administrator.authenticate(fields.email, fields.password, (err, token) => {
        if (err) {
          // we serve the login page from GET as well as failed login POSTs
          res.statusCode = 401
          return httpUtil.writeJson(res, {message: err.toString()})
        }

        const message = 'Authenticated successfully'
        logger.info('%s; token = %s', message, token)

        const cookies = new Cookies(req, res)
        cookies.set('administrator_token', token, {
          path: '/',
          expires: moment().add(1, 'month').toDate(),
        })

        httpUtil.writeJson(res, {message})
      })
    }, 500)
  })
})

export default R.route.bind(R)
