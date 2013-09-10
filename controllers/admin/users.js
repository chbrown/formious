'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var sv = require('sv');
var querystring = require('querystring');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('../../lib/logger');
var misc = require('../../lib/misc');
var models = require('../../lib/models');

// /admin/users/*
var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/users
list all users */
R.get(/^\/admin\/users\/?$/, function(req, res, m) {
  models.User.find({}, '_id created responses.length bonus_paid bonus_owed password superuser tickets.length', function(err, users) {
    if (err) return res.die('User query error: ' + err);

    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/all.mu'], {users: users}).pipe(res);
  });
});

/** GET /admin/users/:user
show single user */
R.get(/^\/admin\/users\/(\w+)$/, function(req, res, m) {
  models.User.fromId(m[1], function(err, user) {
    if (err) return res.die('User query error: ' + err);

    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/one.mu'], {user: user}).pipe(res);
  });
});

/** GET /admin/users/:user/edit
edit single user */
R.get(/^\/admin\/users\/(\w+)\/edit$/, function(req, res, m) {
  models.User.fromId(m[1], function(err, user) {
    if (err) return res.die('User query error: ' + err);

    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/edit.mu'], {user: user}).pipe(res);
  });
});

/** POST /admin/users/:user
update existing User. Should be PATCH, but <form>s only do POST. */
R.post(/^\/admin\/users\/(\w+)$/, function(req, res, m) {
  models.User.fromId(m[1], function(err, user) {
    if (err) return res.die('User query error: ' + err);

    req.readToEnd('utf8', function(err, data) {
      if (err) return res.die('IO read error: ' + err);

      var fields = querystring.parse(data);
      var overwriting_fields = _.pick(fields, 'bonus_paid', 'bonus_owed', 'superuser');
      _.extend(user, overwriting_fields);

      if (fields.password && fields.password.trim()) {
        user.password = fields.password;
      }

      user.save(function(err) {
        if (err) return res.die('User save error: ' + err);

        res.redirect('/admin/users/' + user._id);
      });
    });
  });
});

module.exports = R.route.bind(R);
