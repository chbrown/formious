/*jslint node: true */
var _ = require('underscore');
var async = require('async');
var sv = require('sv');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');
var hash = require('../../lib/hash');
var db = require('../../lib/db');

// /admin/administrators/*
var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/administrators
List all administrators */
R.get(/^\/admin\/administrators$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/administrators/all.mu'], req.ctx).pipe(res);
});

/** GET /admin/administrators/new
Show/edit empty administrator */
R.get(/^\/admin\/administrators\/new/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/administrators/one.mu'], req.ctx).pipe(res);
});

/** GET /admin/administrators/:administrator_id
Show/edit single administrator */
R.get(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/administrators/one.mu'], req.ctx).pipe(res);
});

module.exports = R.route.bind(R);
