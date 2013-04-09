'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'turkserv');

var user_schema = new mongoose.Schema({
  _id: String, // AWS workerId
  created: {type: Date, "default": Date.now},
  seen: [String],
  responses: [],
  paid: {type: Number, "default": 0},
});

var User = db.model('User', user_schema);

module.exports.User = User;
