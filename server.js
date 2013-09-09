#!/usr/bin/env node
'use strict'; /*jslint node: true, es5: true, indent: 2 */
var path = require('path');
var amulet = require('amulet').set({minify: true, root: path.join(__dirname, 'templates')});
// amulet.set(), as opposed amulet.create(), will set the defaults on the module singleton
var http = require('http-enhanced');
var optimist = require('optimist');
var Cookies = require('cookies');

var logger = require('./lib/logger');

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + 31*86400*1000); // 1 month out
  return {path: '/', expires: expires};
};

var argv = optimist.default({
  hostname: '127.0.0.1',
  port: 1451,
  loglevel: 'info',
}).argv;

logger.level = argv.loglevel;

var root_controller = require('./controllers/index');

http.createServer(function(req, res) {
  req.cookies = new Cookies(req, res);
  req.user_id = req.cookies.get('workerId');

  var started = Date.now();
  res.on('finish', function() {
    logger.info('duration', {url: req.url, method: req.method, ms: Date.now() - started});
  });

  // root_controller has signature of (req, res), just like any other controller module
  root_controller(req, res);
}).listen(argv.port, argv.hostname, function() {
  logger.info('listening on %s:%d', argv.hostname, argv.port);
});

