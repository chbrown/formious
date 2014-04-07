/*jslint node: true */
var _ = require('underscore');
var async = require('async');
var sv = require('sv');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');
var db = require('../../lib/db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/access_tokens
List all access_tokens */
R.get(/^\/admin\/access_tokens\/?$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/access_tokens/all.mu'], req.ctx).pipe(res);
});

/** GET /admin/access_tokens/:id
Show/edit single access_token */
R.get(/^\/admin\/access_tokens\/(\d+|new)$/, function(req, res, m) {
  req.ctx.access_token_id = m[1];
  amulet.stream(['admin/layout.mu', 'admin/access_tokens/one.mu'], req.ctx).pipe(res);
});

module.exports = R.route.bind(R);
