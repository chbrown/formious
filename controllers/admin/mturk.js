/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var Router = require('regex-router');
var url = require('url');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/mturk/HITs/new
Form to create new HIT */
R.get(/^\/admin\/mturk\/HITs\/new(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true);
  // defaults come from the querystring
  req.ctx.hit = _.omit(urlObj.query, 'aws_account_id', 'host');
  amulet.stream(['admin/layout.mu', 'admin/mturk/layout.mu', 'admin/mturk/HITs/new.mu'], req.ctx).pipe(res);
});

/** GET /admin/mturk/HITs/:HITId
Show single HIT */
R.get(/^\/admin\/mturk\/HITs\/(\w+)(\?|$)/, function(req, res, m) {
  req.ctx.HITId = m[1];
  amulet.stream(['admin/layout.mu', 'admin/mturk/layout.mu', 'admin/mturk/HITs/one.mu'], req.ctx).pipe(res);
});

/** GET /admin/mturk/HITs
List active HITs */
R.get(/^\/admin\/mturk\/HITs(\?|$)/, function(req, res) {
  amulet.stream(['admin/layout.mu', 'admin/mturk/layout.mu', 'admin/mturk/HITs/all.mu'], req.ctx).pipe(res);
});

module.exports = R.route.bind(R);
