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
  var projection = '_id created responses.length bonus_paid bonus_owed password superuser tickets';
  models.User.find().select(projection).sort('-created').exec(function(err, users) {
    if (err) return res.die('User query error: ' + err);

    req.ctx.users = users;
    amulet.stream(['admin/layout.mu', 'admin/users/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/users/new
create new User and redirect to edit it */
R.get(/^\/admin\/users\/new/, function(req, res, m) {
  models.User.create({}, function(err, user) {
    if (err) return res.die('User.create error: ' + err);

    res.redirect('/admin/users/' + user._id + '/edit');
  });
});

/** GET /admin/users/:user_id
show single user */
R.get(/^\/admin\/users\/(\w+)$/, function(req, res, m) {
  var _id = m[1];
  models.User.findById(_id, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die(404, 'Could not find User: ' + _id);

    user.responses.sort(function(l, r) {
      return (r.created || 0) - (l.created || 0);
    });

    user.responses.forEach(function(response) {
      ['created', 'submitted'].forEach(function(datetime_prop) {
        if (response[datetime_prop]) response[datetime_prop] = new Date(response[datetime_prop]);
      });
      // response.hit_started = response.hit_started ? new Date(response.hit_started) : response.hit_started;
      response.others = _.omit(response, 'created', 'submitted');
    });

    req.ctx.user = user;
    amulet.stream(['admin/layout.mu', 'admin/users/one.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/users/:user_id/edit
edit single user */
R.get(/^\/admin\/users\/(\w+)\/edit$/, function(req, res, m) {
  var _id = m[1];
  models.User.findById(_id, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die(404, 'Could not find User: ' + _id);

    req.ctx.user = user;
    amulet.stream(['admin/layout.mu', 'admin/users/edit.mu'], req.ctx).pipe(res);
  });
});

/** POST /admin/users/:user_id
update existing User. Should be PATCH, but <form>s only do POST. */
R.post(/^\/admin\/users\/(\w+)$/, function(req, res, m) {
  var _id = m[1];
  models.User.findById(_id, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die(404, 'Could not find User: ' + _id);

    req.readToEnd('utf8', function(err, data) {
      if (err) return res.die('IO read error: ' + err);

      var fields = querystring.parse(data);
      // empty-string password means: don't change the password
      if (fields.password === '') delete fields.password;

      user.extendSave(fields, function(err, user) {
        if (err) return res.die('User save error: ' + err);

        res.redirect('/admin/users/' + user._id);
      });
    });
  });
});

/** DELETE /admin/users/:user_id
Delete single User */
R.delete(/^\/admin\/users\/(\w*)$/, function(req, res, m) {
  var _id = m[1];
  models.User.findById(_id, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die(404, 'Could not find User: ' + _id);

    user.remove(function(err) {
      if (err) return res.die('User remove error: ' + err);

      res.json({success: true, message: 'Deleted user: ' + user._id});
    });
  });
});

module.exports = R.route.bind(R);
