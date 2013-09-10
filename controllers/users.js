'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var amulet = require('amulet');
var querystring = require('querystring');
var Router = require('regex-router');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /users/:user
show login page for this user */
R.get(/^\/users\/(\w+)/, function(req, res, m) {
  var workerId = m[1].replace(/\W+/g, '');
  models.User.fromId(workerId, function(err, user) {
    if (err) {
      logger.error('User.fromId(%s) error', workerId, err);
      return res.die(err);
    }

    // login.mu presents a form that submits to /claim or /become depending on the current password status of the user
    amulet.stream(['layout.mu', 'users/login.mu'], {user: user}).pipe(res);
  });
});

/** GET /users/:user/claim
register unclaimed (no set password) user by adding password */
R.post(/^\/users\/(\w+)\/claim/, function(req, res, m) {
  var workerId = m[1].replace(/\W+/g, '');
  req.readToEnd('utf8', function(err, data) {
    var fields = querystring.parse(data);
    models.User.fromId(workerId, function(err, user) {
      if (err) return res.die('User query error: ' + err);
      if (!user) return res.die('User not found: ' + workerId);
      if (user.password) return res.die("User cannot be claimed; the user's password is already set.");
      if (!fields.password.trim()) return res.die('Password cannot be empty');

      user.password = fields.password;
      var ticket = user.newTicket();
      // user now has dirty fields: .password and .tickets
      user.save(function(err) {
        if (err) return res.die('User save error: ' + err);

        req.cookies.set('workerId', user._id);
        req.cookies.set('ticket', ticket);
        // this will just die if the user is not a superuser
        res.redirect('/admin/users/' + user._id);
      });
    });
  });
});

/** GET /users/:user/become
login as claimed user by providing password */
R.post(/^\/users\/(\w+)\/become/, function(req, res, m) {
  var workerId = m[1].replace(/\W+/g, '');
  req.readToEnd('utf8', function(err, data) {
    if (err) {
      logger.error('GET /users/:user/become: req.readToEnd error', err);
      return res.die(err);
    }

    var fields = querystring.parse(data);
    models.User.withPassword(workerId, fields.password, function(err, user) {
      if (err) return res.die('User.withPassword error ' + err);
      if (!user) return res.die('Cannot become user; that user does not exist or the password you entered is incorrect.');

      var ticket = user.newTicket();
      // user now has dirty field: .tickets
      user.save(function(err) {
        if (err) return res.die('User save error: ' + err);

        req.cookies.set('workerId', user._id);
        req.cookies.set('ticket', ticket);
        // this will just die if the user is not a superuser
        res.redirect('/admin/users/' + user._id);
      });
    });
  });
});

// GET /users -> redirect to /users/:current_user_id
R.get(/^\/users\/?$/, function(req, res, m) {
  models.User.fromId(req.user_id, function(err, user) {
    if (err) return res.die('User.fromId error ' + err);
    if (!user) return res.die('User not found: ' + req.user_id);

    res.redirect('/users/' + user._id);
  });
});

module.exports = R.route.bind(R);
