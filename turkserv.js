#!/usr/bin/env node
'use strict'; /*jslint node: true, es5: true, indent: 2 */
var path = require('path');
var amulet = require('amulet');
var http = require('http-enhanced');
var Cookies = require('cookies');
var logger = require('./logger');
var argv = require('optimist').default({port: 1451, hostname: '127.0.0.1'}).argv;
var Router = require('regex-router');
var R = new Router();

amulet.set({minify: true, root: path.join(__dirname, 'templates')});

Cookies.prototype.defaults = function() {
  return {
    path: '/',
    expires: new Date(Date.now() + 31*86400*1000), // 1 month out
  };
};

R.get(/^\/favicon.ico/, function(m, req, res) {
  res.writeHead(404);
  res.end();
});

// attach independent routes
R.any(/^\/stimlists/, require('./controllers/stimlists'));
R.any(/^\/aircraft/, require('./controllers/aircraft'));
R.any(/^\/digits/, require('./controllers/digits'));
R.any(/^\/admin/, require('./controllers/admin'));
R.default = require('./controllers/root');

http.createServer(function(req, res) {
  req.cookies = new Cookies(req, res);

  var started = Date.now();
  res.on('finish', function() {
    logger.info('duration', {url: req.url, method: req.method, ms: Date.now() - started});
  });

  R.route(req, res);
}).listen(argv.port, argv.hostname, function() {
  logger.info('Turkserv ready at ' + argv.hostname + ':' + argv.port);
});
