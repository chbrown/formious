#!/usr/bin/env node
'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var path = require('path');
var amulet = require('amulet');
var http = require('./http-enhanced');
var Cookies = require('cookies');

var Router = require('regex-router');

amulet.set({minify: true, root: path.join(__dirname, 'layouts')});

var logger = require('./logger');

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + (31 * 24 * 60 * 60 * 1000)); // 1 month
  return {expires: expires};
};

var R = new Router();

R.get(/\/favicon.ico/, function(m, req, res) {
  res.writeHead(404);
  res.end();
});

// attach independent routes
require('./aircraft')(R);
require('./admin')(R);

R.default = function(m, req, res) {
  res.redirect('/aircraft');
};

// expose this module's methods incase anything wants them
if (require.main === module) {
  var argv = require('optimist').default({port: 1451, hostname: '127.0.0.1'}).argv;
  http.createServer(function(req, res) {
    req.data = '';
    req.on('data', function(chunk) { req.data += chunk; });
    req.cookies = new Cookies(req, res);
    // logger.info('URL: ' + req.url);

    var started = Date.now();
    res.end = function() {
      logger.info('duration', {url: req.url, method: req.method, ms: Date.now() - started});
      http.ServerResponse.prototype.end.apply(res, arguments);
    };

    R.route(req, res);
  }).listen(argv.port, argv.hostname);
  logger.info('Turkserv ready at ' + argv.hostname + ':' + argv.port);
}
