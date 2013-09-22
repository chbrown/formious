var winston = require('winston');

// winston is awesome and sets the transport levels to a per-transport default,
// so we have to null those out so that the overall logger level is obeyed
var console_transport = new winston.transports.Console();
console_transport.level = null;

var file_transport = new winston.transports.File({filename: '/usr/local/var/log/turkserv.log'});
file_transport.level = null;

module.exports = new winston.Logger({transports: [console_transport, file_transport]});
