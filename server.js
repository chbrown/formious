/*jslint node: true */
var path = require('path');
var send = require('send');
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

var controllers = require('./controllers');

http.ServerResponse.prototype.send = function(req, dir, subpath) {
  var root = path.join(__dirname, dir);
  var res = this;
  send(req, subpath, {root: root})
  .on('error', function(err) {
    res.status(err.status || 500).die('send error: ' + err.message);
  })
  .on('directory', function() {
    res.status(404).die('No resource at: ' + req.url);
  })
  .pipe(res);
};

var server = module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  // var started = Date.now();
  // res.on('finish', function() {
  //   logger.debug('duration', {url: req.url, method: req.method, ms: Date.now() - started});
  // });
  controllers(req, res);
})
.on('listening', function() {
  var address = server.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});

if (require.main === module) {
  server.listen(parseInt(process.env.PORT) || 80, process.env.HOSTNAME);
  logger.level = process.env.DEBUG ? 'debug' : 'info';
}
