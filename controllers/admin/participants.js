/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var logger = require('loge');
var querystring = require('querystring');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');
var sv = require('sv');

var models = require('../../lib/models');
var db = require('../../lib/db');

// /admin/participants/*
var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/participants
list all participants */
R.get(/^\/admin\/participants\/?$/, function(req, res, m) {
  // var projection = '_id created responses.length bonus_paid bonus_owed password superuser tickets';
  new sqlcmd.Select({table: 'participants'})
  .orderBy('created DESC')
  .execute(db, function(err, participants) {
    if (err) return res.die('User query error: ' + err);

    req.ctx.participants = participants;
    amulet.stream(['admin/layout.mu', 'admin/participants/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/participants/:user_id
show single user */
R.get(/^\/admin\/participants\/(\w+)$/, function(req, res, m) {
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
    amulet.stream(['admin/layout.mu', 'admin/participants/one.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/participants/:user_id/edit
edit single user */
R.get(/^\/admin\/participants\/(\d+)\/edit$/, function(req, res, m) {
  var user_id = m[1];
  models.User.findById(_id, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die(404, 'Could not find User: ' + _id);

    req.ctx.user = user;
    amulet.stream(['admin/layout.mu', 'admin/participants/edit.mu'], req.ctx).pipe(res);
  });
});

/** POST /admin/participants/:user_id
update existing User. Should be PATCH, but <form>s only do POST. */
R.post(/^\/admin\/participants\/(\w+)$/, function(req, res, m) {
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

        res.redirect('/admin/participants/' + user._id);
      });
    });
  });
});

/** DELETE /admin/participants/:user_id
Delete single User */
R.delete(/^\/admin\/participants\/(\w*)$/, function(req, res, m) {
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


/** GET /participants/:user_id/logout
helper page to purge ticket (must come before login action below) */
R.get(/^\/participants\/(\w+)\/logout/, function(req, res, m) {
  logger.debug('Deleting ticket cookie "%s" (for user: "%s")', req.cookies.get('ticket'), m[1]);

  req.cookies.del('ticket');
  res.redirect('/participants');
});

module.exports = R.route.bind(R);
