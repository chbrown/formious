/*jslint node: true */
var pg = require('pg');
var logger = require('loge');
var sqlcmd = require('sqlcmd');

// pg.defaults.binary = true; // will this parse numerics as floats?
// pg.defaults.poolSize = 15; // default is 10

// the host value doesn't actually matter; it just has to be there and start with a /
var connection = new sqlcmd.Connection({
  host: '/tmp',
  database: 'human',
});
exports.query = connection.query.bind(connection);
