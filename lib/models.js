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
  // callback signature: function(Error | null, token | null)
  logger.debug('Authenticating where email = %s and password = %s', email, password);

  this.from({
    email: email,
    password: hash.sha256(password),
  }, function(err, administrator) {
    if (err) return callback(err);

    var token = lib.randomString(40);

    new sqlcmd.Insert({table: 'access_tokens'})
    .set({token: token, relation: 'administrators', foreign_id: administrator.id})
    .execute(db, function(err, result) {
      if (err) return callback(err);

      logger.info('Authenticated administrator %d and inserted token "%s"', administrator.id, token);
      return callback(null, token);
    });
  });
};
Administrator.fromToken = function(token, callback) {
  // callback signature: function(err, user || null)
  new sqlcmd.Select({table: 'access_tokens'})
  .where('token = ?', token)
  .where('relation = ?', 'administrators')
  .where('(expires IS NULL OR expires > NOW())')
  .execute(db, function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No access token matched.'));

    new sqlcmd.Select({table: 'administrators'})
    .add('id', 'email')
    .limit(1)
    .where('id = ?', rows[0].foreign_id)
    .execute(db, function(err, rows) {
      if (err) return callback(err);
      if (rows.length === 0) {
        var message = 'Could not find administrator for token.';
        return callback(new Error(message));
      }
      callback(null, new Administrator(rows[0]));
    });
  });
};

var AWSAccount = exports.AWSAccount = function(obj) {
  Record.call(this, obj);
};
AWSAccount.table = 'aws_accounts';
AWSAccount.columns = ['name', 'access_key_id', 'secret_access_key'];
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
Stim.columns = ['experiment_id', 'template_id', 'context', 'view_order', 'created'];
Stim.nextStimId = function(experiment_id, stim_id, callback) {
  /** Searches for the first stim row that:
  1) is in the same experiment
  2) has the lowest view_order
  3) that's greater than the current stim's view_order

  callback(Error)                 // unanticipated error
  callback(null, stim_id: Number) // no error
  callback(null, null)            // no more stims in experiment
  */
  Stim.from({id: stim_id}, function(err, stim) {
    if (err) return callback(err);

    // uses singleton DB
    new sqlcmd.Select({table: 'stims'})
    .where('experiment_id = ?', experiment_id)
    .where('view_order > ?', stim.view_order)
    .orderBy('view_order ASC')
    .limit(1)
    .execute(db, function(err, stims) {
      if (err) return callback(err);
      callback(null, stims.length ? stims[0].id : null);
    });
  });
};
inherit(Stim, Record);

var Participant = exports.Participant = function(obj) {
  Record.call(this, obj);
};
Participant.table = 'participants';
inherit(Participant, Record);
Participant.addResponse = function(participant, response, callback) {
  /**
  participant: {
    aws_worker_id: String, // required
    ip_address: String, // optional
    user_agent: String, // optional
  }
  response: {
    stim_id: Number, // optional
    value: Object, // optional
  }

  callback: function(Error | null, null | inserted_responses_rows)
  */
  Participant.from({aws_worker_id: participant.aws_worker_id}, function(err, existing_participant) {
    if (err) {
      if (!err.message.match(/Could not find match/)) {
        return callback(err);
      }
      new sqlcmd.Insert({table: 'participants'})
      .set(participant)
      .execute(db, function(err, rows) {
        Response.add(rows[0].id, response.stim_id, response.value, callback);
      });
    }
    else {
      Response.add(existing_participant.id, response.stim_id, response.value, callback);
    }
  });
};

var Response = exports.Response = function(obj) {
  Record.call(this, obj);
};
Response.table = 'responses';
inherit(Response, Record);
Response.add = function(participant_id, stim_id, value, callback) {
  new sqlcmd.Insert({table: 'responses'})
  .set({
    participant_id: participant_id,
    stim_id: stim_id,
    value: value,
  })
  .execute(db, callback);
};

var AccessToken = exports.AccessToken = function(obj) {
  Record.call(this, obj);
};
AccessToken.table = 'access_tokens';
inherit(AccessToken, Record);
AccessToken.check = function(token, relation, foreign_id, callback) {
  var select = new sqlcmd.Select({table: 'access_tokens'})
  .where('token = ?', token)
  .where('relation = ?', relation)
  .where('(expires IS NULL OR expires > NOW())')
  .where('redacted IS NULL');

  if (foreign_id !== undefined) {
    select = select.where('foreign_id = ?', foreign_id);
  }

  select.execute(db, function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No access token matched.'));

    callback(err, rows[0]);
  });
};
AccessToken.findOrCreate = function(relation, foreign_id, callback) {
  // callback signature: function(err, token: String)
  // todo: allow expiration
  new sqlcmd.Select({table: 'access_tokens'})
  .where('relation = ?', 'experiments')
  .where('foreign_id = ?', foreign_id)
  .where('(expires IS NULL OR expires > NOW())')
  .where('redacted IS NULL')
  .limit(1)
  .execute(db, function(err, rows) {
    if (err) return callback(err);

    // use existing token
    if (rows.length > 0) {
      return callback(null, rows[0].token);
    }

    var token = lib.randomString(40);

    // insert token
    new sqlcmd.Insert({table: 'access_tokens'})
    .set({
      token: token,
      relation: relation,
      foreign_id: foreign_id
    })
    .execute(db, function(err, result) {
      if (err) return callback(err);

      return callback(null, token);
    });
  });
};

//   // segmenting controls (mostly auto-configured)
//   segmented: {
//     type: Boolean,
//     "default": false,
//   },
//   segments: [String], // set of segment names (from "participant" column in states)
//   segments_claimed: [String], // subset of segment names
