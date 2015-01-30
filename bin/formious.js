#!/usr/bin/env node
/*jslint node: true */
var path = require('path');
var http = require('http-enhanced');
var logger = require('loge');

var yargs = require('yargs')
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

var argv = yargs.argv;
logger.level = argv.verbose ? 'debug' : 'info';

if (argv.help) {
  yargs.showHelp();
}
else if (argv.version) {
  console.log(require('./package').version);
}
else {
  var server = require('../server');
  server.listen(argv.port, argv.hostname);
}

