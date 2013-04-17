'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var __ = require('underscore');
var mechturk = require('mechturk');

var hosts = exports.hosts = [
  {
    id: 'deploy',
    url: 'mechanicalturk.amazonaws.com',
  },
  {
    id: 'sandbox',
    url: 'mechanicalturk.sandbox.amazonaws.com'
  },
];

var accounts = exports.accounts = [
  {
    id: 'chris',
    accessKeyId: process.env.AWS_CHRIS_ID,
    secretAccessKey: process.env.AWS_CHRIS_SECRET
  },
  {
    id: 'ut',
    accessKeyId: process.env.AWS_UT_ID,
    secretAccessKey: process.env.AWS_UT_SECRET
  },
];


var logger = require('./logger');

exports.mechturk = function(host_id, account_id, extra_config) {
  var host = __.findWhere(hosts, {id: host_id});
  var account = __.findWhere(accounts, {id: account_id});
  var opts = {
    url: 'https://' + host.url,
    accessKeyId: account.accessKeyId,
    secretAccessKey: account.secretAccessKey
  };
  __.extend(opts, extra_config);
  return mechturk(opts);
};
