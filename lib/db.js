/*jslint node: true */
var logger = require('loge');
var sqlcmd = require('sqlcmd');

// the host value doesn't actually matter; it just has to be there and start with a /
var connection = module.exports = new sqlcmd.Connection({
  host: '/tmp',
  database: 'human',
});
// connection.logger = logger;
