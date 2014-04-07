/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var querystring = require('querystring');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../lib/models');

var renderLogin = function(ctx, res) {
  // helper, since we serve the login page from GET as well as failed login POSTs
  // ctx may have fields like: email, password, message
  res.status(401); // HTTP 401 Unauthorized
  amulet.stream(['layout.mu', 'login.mu'], ctx).pipe(res);
};

// router & actions for logging in
var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /login
show login page for this user */
R.get(/^\/login\/?$/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  renderLogin(urlObj.query, res);
});

/** POST /login
Try to login as user with email and password */
R.post(/^\/login$/, function(req, res) {
  req.readData(function(err, fields) {
    if (err) return res.die(err);

    // artificially slow to deflect brute force attacks
    setTimeout(function() {
      models.Administrator.authenticate(fields.email, fields.password, function(err, token) {
        if (err) {
          fields.message = err.toString();
          return renderLogin(fields, res);
        }

        logger.info('Authenticated successfully. Token = %s', token);
        req.cookies.set('administrator_token', token);
        res.redirect('/admin');
      });
    }, 500);
  });
});

module.exports = R.route.bind(R);
