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
  // console.log('serving get', m);
  models.User.fromId(m[1], function(err, user) {
    if (err) return res.die('User.fromId error: ' + err);

    // login.mu presents a form that submits to /claim or /become depending on the current password status of the user
    amulet.stream(['layout.mu', 'users/login.mu'], {user: user}).pipe(res);
  });
});

/** GET /users/:user/logout
helper page to purge ticket */
R.get(/^\/users\/(\w+)\/logout/, function(req, res, m) {
  logger.debug('Deleting ticket cookie "%s" (for user: "%s")', req.cookies.get('ticket'), m[1]);

  req.cookies.del('ticket');
  res.redirect('/users');
});

/** POST /users/login
register unclaimed (no set password) user by adding password,
or login as claimed user by providing password */
R.post('/users/login', function(req, res) {
  var become = function(user) {
    var ticket = user.newTicket();
    // user now has dirty fields: .password and .tickets
    user.save(function(err) {
      if (err) return res.die('User save error: ' + err);

      req.cookies.set('workerId', user._id);
      req.cookies.set('ticket', ticket);
      // this will just die if the user is not a superuser
      res.redirect('/admin/users/' + user._id);
    });
  };

  req.readToEnd('utf8', function(err, data) {
    if (err) return res.die('POST /users/login: req.readToEnd error', err);

    var fields = querystring.parse(data);
    _.defaults(fields, {user_id: '', password: ''});
    if (!fields.user_id.trim()) return res.die('User cannot be empty');
    if (!fields.password.trim()) return res.die('Password cannot be empty');

    models.User.findById(fields.user_id, function(err, user) {
      if (err) return res.die('User.findById error: ' + err);
      if (!user) return res.die('User not found: ' + fields.user_id);

      if (user.password) {
        // become
        console.log('authenticating with:', fields.user_id, fields.password);
        models.User.withPassword(fields.user_id, fields.password, function(err, user) {
          if (err) return res.die('User.withPassword error ' + err);
          if (!user) return res.die('Cannot become user; the password you entered is incorrect.');

          become(user);
        });
      }
      else {
        // claim (and then become)
        user.password = fields.password;
        become(user);
      }
    });
  });
});

/** GET /users
redirect to /users/:current_user */
R.get(/^\/users\/?$/, function(req, res, m) {
  models.User.findById(req.user_id, function(err, user) {
    if (err) return res.die('User.findById error ' + err);
    if (!user) return res.die('User not found: ' + req.user_id);

    res.redirect('/users/' + user._id);
  });
});

module.exports = R.route.bind(R);
