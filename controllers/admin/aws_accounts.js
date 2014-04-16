/*jslint node: true */
var amulet = require('amulet');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/aws_accounts
List all AWS accounts. */
R.get(/^\/admin\/aws_accounts$/, function(req, res) {
  amulet.stream(['admin/layout.mu', 'admin/aws_accounts/all.mu'], req.ctx).pipe(res);
});

/** GET /admin/aws_accounts/new
Show empty AWS account */
R.get(/^\/admin\/aws_accounts\/new$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/aws_accounts/one.mu'], req.ctx).pipe(res);
});

/** GET /admin/aws_accounts/:administrator_id
Show single AWS account */
R.get(/^\/admin\/aws_accounts\/(\d+)$/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/aws_accounts/one.mu'], req.ctx).pipe(res);
});

module.exports = R.route.bind(R);
