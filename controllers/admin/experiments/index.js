/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var async = require('async');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');
var url = require('url');

var db = require('../../../lib/db');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** ANY /admin/experiments/:experiment_id/stims/*
Forward /stims/ requests to sub controller */
R.any(/^\/admin\/experiments\/(\d+)\/stims/, require('./stims'));

/** GET /admin/experiments
List all Experiments */
R.get(/^\/admin\/experiments\/?$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/experiments/all.mu'], req.ctx).pipe(res);
});

/** GET /admin/experiments/new
create new Experiment and redirect to edit it */
R.get(/^\/admin\/experiments\/new/, function(req, res, m) {
  req.ctx.experiment = {
    administrator_id: req.ctx.current_user.id,
    parameters: [],
  };
  amulet.stream(['admin/layout.mu', 'admin/experiments/one.mu'], req.ctx).pipe(res);
});

/** GET /admin/experiments/:experiment_id
Edit existing Experiment (or just view) */
R.get(/^\/admin\/experiments\/(\d+)(.json)?$/, function(req, res, m) {
  models.Experiment.one({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    req.ctx.experiment = experiment;
    amulet.stream(['admin/layout.mu', 'admin/experiments/one.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/experiments/:experiment_id/responses
Redirect to a page with ad-hoc authorization */
R.get(/^\/admin\/experiments\/(\d+)\/responses(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  // should this be a POST?

  // try to use an existing access token
  models.AccessToken.findOrCreate('experiments', experiment_id, {length: 10}, function(err, token) {
    if (err) return res.die(err);
    logger.info('Using token: %s, to access experiment %s', token, experiment_id);

    var redirect = '/experiments/' + experiment_id + '/responses?token=' + token;
    res.redirect(redirect);
  });
});

/** GET /admin/experiments/:experiment_id/mturk
Redirect to a the MTurk submission page */
R.get(/^\/admin\/experiments\/(\d+)\/mturk(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  // find the default account for this user
  db.Select('aws_account_administrators')
  .whereEqual({administrator_id: req.administrator.id})
  .orderBy('priority DESC')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.die(err);
    if (rows.length === 0) {
      err = new Error('No accounts linked to current administrator');
      return res.die(err);
    }

    var account = rows[0];
    // default to sandbox
    var host = 'sandbox';

    console.log('req', req);

    var experiment_url = '???';
    // localizeUrl('/experiments/' + experiment_id)
    var redirect = url.format({
      pathname: '/admin/aws/' + account.aws_account_id + '/hosts/' + host + '/HITs/new',
      query: {ExternalURL: experiment_url}
    });

    res.redirect(redirect);
  });
});

module.exports = R.route.bind(R);
