#!/usr/bin/env node
/*jslint node: true */
var path = require('path');
var http = require('http-enhanced');
var logger = require('loge');

// amulet.set(), as opposed amulet.create(), will set the defaults on the module singleton
var amulet = require('amulet').set({
  root: path.join(__dirname, 'templates'),
  // minify: true,
  open: '<%',
  close: '%>',
  globals: {
    serialize: function(obj) {
      // stringifies and makes sure that the resulting json can be embedded in
      // a <script> environment
      if (obj === undefined) {
        return 'undefined';
      }
      return JSON.stringify(obj).replace(/<\//g, '<\\/');
    }
  }
});

// enhance http-enhanced a little more
http.ServerResponse.prototype.die = function(error) {
  if (this.statusCode == 200) {
    this.statusCode = 500;
  }
  logger.error('res.die:', error.stack, error);
  return this.text(error ? 'Failure: ' + error.toString() : 'Failure');
};

var Cookies = require('cookies');
Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + 31*86400*1000); // 1 month out
  return {path: '/', expires: expires};
};

var optimist = require('optimist')
  .describe({
    hostname: 'hostname to listen on',
    port: 'port to listen on',

    help: 'print this help message',
    verbose: 'print extra output',
    version: 'print version',
  })
  .boolean(['help', 'verbose', 'version'])
  .alias({verbose: 'v'})
  .default({
    hostname: '127.0.0.1',
    port: 1451,
  });

var argv = optimist.argv;
logger.level = argv.verbose ? 'debug' : 'info';

if (argv.help) {
  optimist.showHelp();
}
else if (argv.version) {
  console.log(require('./package').version);
}
else {
  var root_controller = require('./controllers');

  http.createServer(function(req, res) {
    req.cookies = new Cookies(req, res);
    // req.ip = req.headers['x-real-ip'] || req.client.remoteAddress;

    // var started = Date.now();
    // res.on('finish', function() {
    //   logger.debug('duration', {url: req.url, method: req.method, ms: Date.now() - started});
    // });

    // root_controller has signature of (req, res), just like any other controller module
    root_controller(req, res);
  }).listen(argv.port, argv.hostname, function() {
    logger.info('listening on http://%s:%d', argv.hostname, argv.port);
  });
}
