var winston = require('winston');

var logger = module.exports = new winston.Logger({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({filename: '/usr/local/var/log/turkserv.log'})
  ]
});
logger.maybe = function (err) { if (err) logger.error(err); };
logger.level = 'verbose';
