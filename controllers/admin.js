/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var Router = require('regex-router');
var Cookies = require('cookies');

var logger = require('loge');
var models = require('../models');

var R = new Router(function(req, res) {
  res.send(req, 'ng', 'layout.html');
});

/** POST /admin/logout
Purge administrator_token cookie, and redirect */
R.post(/^\/admin\/logout/, function(req, res) {
  var cookies = new Cookies(req, res);

  logger.debug('Deleting administrator_token cookie: %s', cookies.get('administrator_token'));
  cookies.del('administrator_token');
  res.redirect('/admin');
});

// router & controllers requiring authentication
module.exports = function(req, res) {
  // handle auth and forward. this is the checkpoint for all admin-level
  // requests, and should send all non administrators to the login page.
  var cookies = new Cookies(req, res);
  var token = cookies.get('administrator_token');
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
