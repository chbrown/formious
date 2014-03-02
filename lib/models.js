/*jslint node: true */
var _ = require('underscore');
var util = require('util');
var logger = require('loge');
var sqlcmd = require('sqlcmd');

var lib = require('./');
var hash = require('./hash');
var db = require('./db');

var inherit = function(Class, SuperClass) {
  util.inherits(Class, SuperClass);
  _.extend(Class, SuperClass);
};

// var prefixedStringId = function(prefix) {
//   // the prefixedness only applies to the default value
//   return {
//     type: String,
//     match: /^\w+$/, // \w is [A-Za-z0-9_]
//     'default': function() { // gets no arguments
//       // mongoose.Types.ObjectId().toString()
//       return prefix + Math.random().toString().slice(2, 5);
//     }
//   };
// };
// var StringId = prefixedStringId('');

// var extendSave = function(properties, callback) {
//   / * * extendSave: take a Mongo Document, extend it with some properties, and persist it to the database.

//   This will be added to several schemas' `methods` field, so `this` will be a single mongo document.
//   The document you call this on should be fully retrieved (i.e., not projected).

//   It is more than just the normal .save(), though, because it will handle _id modifications, if properties._id is not the same as the current _id. If there is a document with the same _id as the new _id, it will simply overwrite it.
//   Also, the given object will continue to refer to the removed document.
//   Use the returned object instead of your old one.

//   TODO: add option to fail on attempts to write over existing document with a new _id.

//   properties:
//   callback: function(Error | null, Object | null)
//   * /
//   logger.debug('extendSave, %s -> %s', this._id, properties._id);
//   if (properties._id !== undefined && properties._id !== this._id) {
//     // keep the original id around so that we can delete it later if needed
//     var original = this;
//     // this way of getting the model is kind of weird. Mongoose is weird.
//     // var Model = this.model(this.constructor.modelName);
//     // var Model = this.constructor;
//     var new_properties = _.extend({}, this.toObject(), properties);
//     // new Model(new_properties).save(...
//     this.constructor.create(new_properties, function(err, obj) {
//       if (err) return callback(err);

//       original.remove(function(err) {
//         callback(err, obj);
//       });
//     });
//   }
//   else {
//     // normal save, nothing special
//     _.extend(this, properties);
//     this.save(callback);
//   }
// };

// var user_schema = new mongoose.Schema({
//   _id: prefixedStringId('user_'), // usually the AWS workerId
//   created: {type: Date, 'default': Date.now},
//   seen: [String],
//   responses: [
//      e.g. {
//       // generic:
//       workerId: config.workerId,
//       task_started: config.task_started,
//       correct: correct,
//       time: time() - this.get('shown'),
//       version: config.version

//       prior: this.collection.batch.get('prior'),
//       batch_index: this.collection.batch.id,
//       scene_index: this.id,
//       reliabilities: _.map(this.get('allies'), function(ally) { return ally.reliability.toFixed(4); }),
//       judgments: _.pluck(this.get('allies'), 'judgment'),
//       truth: this.get('truth'),
//       choice: choice,
//       image_id: this.get('image_id'),
//       width: this.get('width'),
//     }, ...

//   ],
//   bonus_paid: {type: Number, 'default': 0},
//   bonus_owed: {type: Number, 'default': 0},
//   password: {
//     type: String,
//     set: sha256,
//   },
//   superuser: {type: Boolean, 'default': false},
//   tickets: [String]
// });

var Record = function(obj) {
  _.extend(this, obj);
};
Record.find = function(pattern, callback) {
  /** Find all records that precisely match pattern.

  callback(Error)
  callback(null, records | [])

  Be careful! This susceptible to injection -- pattern's keys are not escaped.
  */
  var Constructor = this;
  new sqlcmd.Select({table: this.table})
  .whereEqual(pattern)
  .execute(db, function(err, rows) {
    if (err) return callback(err);

    var records = rows.map(function(row) {
      return new Constructor(row);
    });
    callback(null, records);
  });
};
Record.first = function(pattern, callback) {
  /** Find the first record that matches pattern, or null.

  callback(Error)
  callback(null, record | null)

  Be careful! susceptible to injection -- pattern's keys are not escaped.
  */
  var Constructor = this;
  new sqlcmd.Select({table: this.table})
  .limit(1)
  .whereEqual(pattern)
  .execute(db, function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(null, null);

    var record = new Constructor(rows[0]);
    callback(null, record);
  });
};
Record.from = function(pattern, callback) {
  /** Find the first record that matches pattern, calling back with an error if none can be found.

  `from()` is like `first()`, but considers no results to be an error.

  callback(Error)
  callback(null, record)
  */
  var Constructor = this;
  this.first(pattern, function(err, record) {
    if (err) return callback(err);
    if (record === null) {
      var pattern_string = util.inspect(pattern);
      var message = 'Could not find match in ' + Constructor.table + '.';
      return callback(new Error(message));
    }

    callback(null, record);
  });
};
Record.fromId = function(id, callback) {
  this.from({id: id}, callback);
};

var Administrator = exports.Administrator = function(obj) {
  Record.call(this, obj);
};
inherit(Administrator, Record);
Administrator.table = 'administrators';
Administrator.authenticate = function(email, password, callback) {
  // callback signature: function(Error | null, ticket | null)
  logger.debug('Authenticating where email = %s and password = %s', email, password);

  // new sqlcmd.Select({table: 'administrators'})
  // .where('email = ?', email)
  // .where('password = ?', hash.sha256(password))
  // .execute(db, function(err, rows) {
  this.from({
    email: email,
    password: hash.sha256(password),
  }, function(err, administrator) {
    if (err) return callback(err);

    var ticket = lib.randomString(40);

    new sqlcmd.Insert({table: 'tickets'})
    .set({user_id: administrator.id, key: ticket})
    .execute(db, function(err, result) {
      if (err) return callback(err);

      logger.info('Authenticated administrator %d and inserted ticket "%s"', administrator.id, ticket);
      return callback(null, ticket);
    });
  });
};
Administrator.fromTicket = function(key, callback) {
  // callback signature: function(err, user || null)
  new sqlcmd.Select({table: 'tickets'})
  .where('key = ?', key)
  .where('(expires IS NULL OR expires > NOW())')
  .execute(db, function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No ticket matches key'));

    return Administrator.fromId(rows[0].user_id, callback);
  });
};

var AWSAccount = exports.AWSAccount = function(obj) {
  Record.call(this, obj);
};
AWSAccount.table = 'aws_accounts';
inherit(AWSAccount, Record);

var Experiment = exports.Experiment = function(obj) {
  Record.call(this, obj);
};
Experiment.table = 'experiments';
Experiment.columns = ['name', 'administrator_id', 'html', 'parameters'];
inherit(Experiment, Record);

var Template = exports.Template = function(obj) {
  Record.call(this, obj);
};
Template.table = 'templates';
Template.columns = ['name', 'html'];
inherit(Template, Record);

var Stim = exports.Stim = function(obj) {
  Record.call(this, obj);
};
Stim.table = 'stims';
inherit(Stim, Record);

var Participant = exports.Participant = function(obj) {
  Record.call(this, obj);
};
Participant.table = 'participants';
inherit(Participant, Record);
Participant.addResponse = function(aws_worker_id, stim_id, value, callback) {
  /**
  callback: function(Error | null, null | inserted_responses_rows)
  */
  var addWithParticipantId = function(err, participant_id) {
    new sqlcmd.Insert({table: 'responses'})
    .set({
      participant_id: participant_id,
      stim_id: stim_id,
      value: value,
    })
    .execute(db, callback);
  };
  Participant.from({aws_worker_id: aws_worker_id}, function(err, participant) {
    if (err) {
      if (!err.message.match(/Could not find match/)) {
        return callback(err);
      }
      new sqlcmd.Insert({table: 'participants'})
      .set({aws_worker_id: aws_worker_id})
      .execute(db, function(err, rows) {
        addWithParticipantId(null, rows[0].id);
      });
    }
    else {
      addWithParticipantId(null, participant.id);
    }
  });
};


// User.methods.newTicket = function() {
//   // creates a new ticket, adds it to the user, and returns it
//   var ticket = misc.alphadec(40);
//   this.tickets.push(ticket);
//   return ticket;
// };

// var account_schema = new mongoose.Schema({
//   _id: prefixedStringId('account_'),
//   accessKeyId: String,
//   secretAccessKey: String,
//   created: {type: Date, 'default': Date.now},
// });


// var stimlist_schema = new mongoose.Schema({
//   _id: prefixedStringId('stimlist_'),
//   created: {type: Date, 'default': Date.now},
//   creator: String, // should be mongoose.Schema.Types.ObjectId, technically
//   raw: String, // original text, unadulterated. Could be used to re-generated states list.
//   columns: [String], // original order of columns, for displaying it in tabular form
//   states: [
//     /* e.g., {
//       stim: 'consent'
//     }, {
//       // required
//       stim: 'digits',
//       preview: true, // defaults to true
//       // freeform
//       digits: '5,9,7,4,6',
//       allies: 'lucy,menard,george',
//       judgments: 'yes,yes,no',
//     }, ... */
//   ],
//   // the following are used primarily when the states are determined for a participant
//   pre_stim: String, // stim to prepend to all experiments
//   default_stim: String, // stim to use if no stim is specified (defaults to "default")
//   post_stim: String, // stim to append to all experiments
//   // segmenting controls (mostly auto-configured)
//   segmented: {
//     type: Boolean,
//     "default": false,
//   },
//   segments: [String], // set of segment names (from "participant" column in states)
//   segments_claimed: [String], // subset of segment names
// });

// stimlist_schema.methods.extendSave = extendSave;

// var Stimlist = exports.Stimlist = mongoose.model('Stimlist', stimlist_schema);

// var stim_template_schema = new mongoose.Schema({
//   _id: prefixedStringId('stimtemplate_'),
//   // move /stims content to database objects
//   created: {type: Date, 'default': Date.now},
//   html: String,
// });

// stim_template_schema.methods.extendSave = extendSave;

// var StimTemplate = exports.StimTemplate = mongoose.model('StimTemplate', stim_template_schema);
