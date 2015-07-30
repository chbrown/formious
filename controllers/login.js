var Router = require('regex-router');
var Cookies = require('cookies');
var moment = require('moment');

var logger = require('loge').logger;
var models = require('../models');

// router & actions for logging in
var R = new Router();

/** POST /login
Try to login as user with email and password */
R.post(/^\/login$/, function(req, res) {
  req.readData(function(err, fields) {
    if (err) return res.die(err);

    // artificially slow to deflect brute force attacks
    setTimeout(function() {
      models.Administrator.authenticate(fields.email, fields.password, function(err, token) {
        if (err) {
          // we serve the login page from GET as well as failed login POSTs
          res.status(401);
          return res.json({message: err.toString()});
        }

        var message = 'Authenticated successfully';
        logger.info('%s; token = %s', message, token);

        var cookies = new Cookies(req, res);
        cookies.set('administrator_token', token, {
          path: '/',
          expires: moment().add(1, 'month').toDate(),
        });

        res.json({message: message});
      });
    }, 500);
  });
});

module.exports = R.route.bind(R);
