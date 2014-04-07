/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var querystring = require('querystring');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');

// router & controllers requiring authentication
var R = new Router(function(req, res) {
  // GET /admin -> redirect to /admin/experiments
  res.redirect('/admin/experiments');
});
R.any(/^\/admin\/aws/, require('./aws'));
R.any(/^\/admin\/experiments/, require('./experiments'));
R.any(/^\/admin\/templates/, require('./templates'));
R.any(/^\/admin\/administrators/, require('./administrators'));
R.any(/^\/admin\/participants/, require('./participants'));
R.any(/^\/admin\/access_tokens/, require('./access_tokens'));

/** POST /admin/logout
Purge administrator_token cookie, and redirect */
R.post(/^\/admin\/logout/, function(req, res) {
  logger.debug('Deleting administrator_token cookie: %s', req.cookies.get('administrator_token'));

  req.cookies.del('administrator_token');
  res.redirect('/admin');
});

module.exports = function(req, res) {
  // handle auth and forward. this is the checkpoint for all admin-level
  // requests, and should send all non administrators to the login page.
  var token = req.cookies.get('administrator_token');
  models.Administrator.fromToken(token, function(err, administrator) {
    if (err) {
      logger.error('Administrator not authenticated:', err);
      res.redirect('/login');
    }
    else {
      // alright, they're in. go wild.
      // attach administrator object to the request payload
      req.administrator = administrator;
      req.ctx = {current_user: administrator};
      R.route(req, res);
    }
  });
};
