/*jslint node: true */
var logger = require('loge');
var Router = require('regex-router');
var Cookies = require('cookies');
var streaming = require('streaming');
var sv = require('sv');
var _ = require('underscore');
var models = require('../../models');

var excel = require('../../lib/excel');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.any(/^\/api\/access_tokens/, require('./access_tokens'));
R.any(/^\/api\/administrators/, require('./administrators'));
R.any(/^\/api\/aws_accounts/, require('./aws_accounts'));
R.any(/^\/api\/experiments/, require('./experiments'));
R.any(/^\/api\/mturk/, require('./mturk'));
R.any(/^\/api\/participants/, require('./participants'));
R.any(/^\/api\/templates/, require('./templates'));

module.exports = function(req, res) {
  // require administrator privileges
  var cookies = new Cookies(req, res);
  var token = cookies.get('administrator_token');
  models.Administrator.fromToken(token, function(err, administrator) {
    if (err) {
      res.status(401).die('Authorization failed; you must login first.');
    }
    else {
      // authentication succeeded!
      req.administrator = administrator;
      R.route(req, res);
    }
  });
};
