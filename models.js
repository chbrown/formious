'use strict'; /*jslint node: true, es5: true, indent: 2 */
var crypto = require('crypto');
var mongoose = require('mongoose');
var logger = require('./logger');
var db = mongoose.createConnection('localhost', 'turkserv');
var _ = require('underscore');

var SALT = 'rNxROdgCbAkBI2WvZJtH';
function _sha256(s) {
  var shasum = crypto.createHash('sha256');
  shasum.update(SALT, 'utf8');
  shasum.update(s, 'utf8');
  return shasum.digest('hex');
}

function _ticket() {
  var store = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  return _.range(40).map(function() {
    return store[(Math.random() * store.length) | 0];
  }).join('');
}

var user_schema = new mongoose.Schema({
  _id: String, // AWS workerId
  created: {type: Date, 'default': Date.now},
  seen: [String],
  responses: [
    /* e.g. {
      // generic:
      workerId: config.workerId,
      task_started: config.task_started,
      correct: correct,
      time: now() - this.get('shown'),
      version: config.version

      prior: this.collection.batch.get('prior'),
      batch_index: this.collection.batch.id,
      scene_index: this.id,
      reliabilities: _.map(this.get('allies'), function(ally) { return ally.reliability.toFixed(4); }),
      judgments: _.pluck(this.get('allies'), 'judgment'),
      truth: this.get('truth'),
      choice: choice,
      image_id: this.get('image_id'),
      width: this.get('width'),
    }, ...
    */
  ],
  bonus_paid: {type: Number, 'default': 0},
  bonus_owed: {type: Number, 'default': 0},
  password: String,
  superuser: {type: Boolean, 'default': false},
  tickets: {type: [String], 'default': []},
});

user_schema.statics.fromId = function(workerId, callback) {
  // callback signature: function(err, user)
  var Self = this;
  this.findById(workerId, function(err, user) {
    if (!user) {
      user = new Self({_id: workerId});
      user.save(logger.maybe);
    }
    callback(err, user);
  });
};

user_schema.statics.withTicket = function(workerId, ticket, callback) {
  // callback signature: function(err, user || null)
  workerId = (workerId || '').replace(/\W+/g, '');
  ticket = (ticket || '').replace(/\W+/g, '');
  this.findOne({_id: workerId, tickets: ticket}, callback);
};

user_schema.statics.withPassword = function(workerId, password, callback) {
  // callback signature: function(err, user || null)
  this.findOne({_id: workerId, password: _sha256(password)}, function(err, user) {
    if (err || !user) {
      callback(err);
    }
    else {
      // create new ticket
      user.tickets.push(_ticket());
      user.save(function(err) {
        callback(err, user);
      });
    }
  });
};

user_schema.methods.setPassword = function(password, callback) {
  // callback signature: function(err, user)
  var self = this;
  this.password = _sha256(password);
  // create new ticket, too
  this.tickets.push(_ticket());
  this.save(function(err) {
    callback(err, self);
  });
};

var User = exports.User = db.model('User', user_schema);

var account_schema = new mongoose.Schema({
  _id: String, // name
  accessKeyId: String, // accessKeyId
  secretAccessKey: String, // secretAccessKey
  created: {type: Date, 'default': Date.now},
});

var AWSAccount = exports.AWSAccount = db.model('AWSAccount', account_schema);

var stimlist_schema = new mongoose.Schema({
  created: {type: Date, 'default': Date.now},
  creator: String, // should be mongoose.Schema.Types.ObjectId,
  slug: String,
  csv: String, // original text, unadulterated. Could be used to re-generated states list.
  states: [
    /* e.g., {
      stim: 'consent'
    }, {
      // required
      stim: 'digits',
      preview: true, // defaults to true
      // freeform
      digits: '5,9,7,4,6',
      allies: 'lucy,menard,george',
      judgments: 'yes,yes,no',
    }, ... */
  ],
});

var Stimlist = exports.Stimlist = db.model('Stimlist', stimlist_schema);
