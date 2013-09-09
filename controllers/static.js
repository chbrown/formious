'use strict'; /*jslint es5: true, node: true, indent: 2 */
var path = require('path');
var send = require('send');

var logger = require('../lib/logger');

var static_root = path.join(__dirname, '..', 'static');

module.exports = function(req, res, m) {
  var path = req.url.slice(8); // since '/static/'.length == 8
  if (req.url == '/favicon.ico') {
    path = 'favicon.ico';
  }

  send(req, path)
    .root(static_root)
    .on('error', function(err) {
      logger.info('static.send error', err);
      res.die(err.status || 500, err.message);
    })
    .on('directory', function() {
      res.die(404, 'Cannot fetch static directory: ' + req.url);
    })
    .pipe(res);
};
