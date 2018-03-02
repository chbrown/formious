var http = require('http-enhanced');
var logger = require('loge').logger;
var controllers = require('./controllers');

http.ServerResponse.prototype.die = function(error) {
  if (this.statusCode == 200) {
    this.statusCode = 500;
  }
  var message = error ? error.stack : 'Failure';
  return this.text(message);
};

var server = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  controllers(req, res);
});

server.on('listening', function() {
  var address = server.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});

module.exports = server;
