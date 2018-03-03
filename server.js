var path = require('path');
var optimist = require('optimist');

var http = require('http-enhanced');
var loge = require('loge');

var controllers = require('./controllers');
var db = require('./db');

function dieResponse(error) {
  if (this.statusCode == 200) {
    this.statusCode = 500;
  }
  var message = error ? error.stack : 'Failure';
  return this.text(message);
}
http.ServerResponse.prototype.die = dieResponse;

var server = http.createServer(function(req, res) {
  loge.logger.debug('%s %s', req.method, req.url);
  controllers(req, res);
});

server.on('listening', function() {
  var address = server.address();
  loge.logger.info('server listening on http://%s:%d', address.address, address.port);
});

function main() {
  var argvparser = optimist
  .usage('formious --port 1451 -v')
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
    hostname: process.env.HOSTNAME || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 80,
    verbose: process.env.DEBUG !== undefined,
  });

  var argv = argvparser.argv;
  loge.logger.level = argv.verbose ? loge.Level.debug : loge.Level.info;

  if (argv.help) {
    argvparser.showHelp();
  }
  else if (argv.version) {
    console.log(require('./package').version);
  }
  else {
    db.createDatabaseIfNotExists(function(err) {
      if (err) throw err;

      var migrations_dirpath = path.join(__dirname, 'migrations');
      db.executePatches('_migrations', migrations_dirpath, function(err) {
        if (err) throw err;

        server.listen(argv.port, argv.hostname);
      });
    });
  }
}

module.exports = server;
module.exports.main = main;
