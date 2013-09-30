'use strict'; /*jslint node: true, es5: true, indent: 2 */
var crypto = require('crypto');
var mongoose = exports.mongoose = require('mongoose');
// try to fix mongoose's broken error handling
// require('mongoose/lib/utils').tick = function(callback) { return callback; };
var _ = require('underscore');

var misc = require('./misc');
var logger = require('./logger');

var SALT = 'rNxROdgCbAkBI2WvZJtH';
function sha256(s) {
  var shasum = crypto.createHash('sha256');
  shasum.update(SALT, 'utf8');
  shasum.update(s, 'utf8');
  return shasum.digest('hex');
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
      time: time() - this.get('shown'),
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
  password: {
    type: String,
    set: sha256,
  },
  superuser: {type: Boolean, 'default': false},
  tickets: [String]
});

user_schema.statics.fromId = function(id, callback) {
  /** User.fromId(...): take a user id and find or create the corresponding user.

  id: String | null
      We sanitize it and provide a default in this function.
  callback: function(Error | null, User | null)
  */
  //
  var User = this;
  var user_id = id ? id.toString().replace(/\W+/g, '') : 'public';
  this.findById(user_id, function(err, user) {
    if (err) return callback(err);

    if (user) {
      callback(null, user);
    }
    else {
      new User({_id: user_id}).save(function(err, user) {
        callback(err, user);
      });
    }
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
  this.findOne({_id: workerId, password: sha256(password)}, function(err, user) {
    if (err) return callback(err);
    if (!user) return callback();

    callback(null, user);
  });
};

user_schema.methods.newTicket = function() {
  // creates a new ticket, adds it to the user, and returns it
  var ticket = misc.alphadec(40);
  this.tickets.push(ticket);
  return ticket;
};

var User = exports.User = mongoose.model('User', user_schema);

var account_schema = new mongoose.Schema({
  name: {
    type: String,
    match: /^\w+$/,
  },
  accessKeyId: String,
  secretAccessKey: String,
  created: {type: Date, 'default': Date.now},
});

var AWSAccount = exports.AWSAccount = mongoose.model('AWSAccount', account_schema);

var stimlist_schema = new mongoose.Schema({
  created: {type: Date, 'default': Date.now},
  creator: String, // should be mongoose.Schema.Types.ObjectId, technically
  slug: String,
  raw: String, // original text, unadulterated. Could be used to re-generated states list.
  columns: [String], // original order of columns, for displaying it in tabular form
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
  // the following are used primarily when the states are determined for a participant
  pre_stim: String, // stim to prepend to all experiments
  default_stim: String, // stim to use if no stim is specified (defaults to "default")
  post_stim: String, // stim to append to all experiments
  // segmenting controls (mostly auto-configured)
  segmented: {
    type: Boolean,
    "default": false,
  },
  segments: [String], // set of segment names (from "participant" column in states)
  segments_claimed: [String], // subset of segment names
});

var Stimlist = exports.Stimlist = mongoose.model('Stimlist', stimlist_schema);

var stim_template_schema = new mongoose.Schema({
  // move /stims content to database objects
  created: {type: Date, 'default': Date.now},
  name: String,
  html: String,
});

var StimTemplate = exports.StimTemplate = mongoose.model('StimTemplate', stim_template_schema);
