var {logger} = require('loge');
var sqlcmd = require('sqlcmd-pg');

// the DB_PORT_5432_* values come from docker
var db = new sqlcmd.Connection({
  host: process.env.DB_PORT_5432_TCP_ADDR || '127.0.0.1',
  port: process.env.DB_PORT_5432_TCP_PORT || '5432',
  user: 'postgres',
  database: 'formious',
});

// attach local logger to sqlcmd.Connection log events
db.on('log', function(ev) {
  var args = [ev.format].concat(ev.args);
  logger[ev.level].apply(logger, args);
});

module.exports = db;
