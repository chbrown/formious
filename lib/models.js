/*jslint node: true */
var _ = require('underscore');
var logger = require('loge');
var ORM = require('sqlcmd/orm').ORM;

var lib = require('./');
var hash = require('./hash');
var db = require('./db');

var orm = new ORM(db);

var Administrator = exports.Administrator = orm.model('administrators',
  ['email', 'password']);
Administrator.authenticate = function(email, password, callback) {
  // callback signature: function(Error | null, token | null)
  logger.debug('Authenticating where email = %s', email);

  this.one({
    email: email,
    password: hash.sha256(password),
  }, function(err, administrator) {
    if (err) return callback(err);

    AccessToken.findOrCreate('administrators', administrator.id, {length: 40}, function(err, token) {
      if (err) return callback(err);

      logger.info('Authenticated administrator %d and inserted token "%s"', administrator.id, token);
      return callback(null, token);
    });
  });
};
Administrator.fromToken = function(token, callback) {
  /** Get administrator object from token.

  callback signature: function(err, user || null)
  */
  if (!token) {
    token = '';
  }
  db.Select('access_tokens')
  .where('token = ?', token)
  .where('relation = ?', 'administrators')
  .where('(expires IS NULL OR expires > NOW())')
  .execute(function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No access token matched.'));

    db.Select('administrators')
    .add('id', 'email')
    .limit(1)
    .where('id = ?', rows[0].foreign_id)
    .execute(function(err, rows) {
      if (err) return callback(err);
      if (rows.length === 0) {
        var message = 'Could not find administrator for token.';
        return callback(new Error(message));
      }
      callback(null, new Administrator(rows[0]));
    });
  });
};

var AWSAccount = exports.AWSAccount = orm.model('aws_accounts',
  ['name', 'access_key_id', 'secret_access_key']);

var Experiment = exports.Experiment = orm.model('experiments',
  ['name', 'administrator_id', 'html', 'parameters']);

var Template = exports.Template = orm.model('templates',
  ['name', 'html']);

var Stim = exports.Stim = orm.model('stims',
  ['experiment_id', 'template_id', 'context', 'view_order', 'created']);
Stim.nextStimId = function(experiment_id, stim_id, callback) {
  /** Searches for the first stim row that:
  1) is in the same experiment
  2) has the lowest view_order
  3) that's greater than the current stim's view_order

  callback(Error)                 // unanticipated error
  callback(null, stim_id: Number) // no error
  callback(null, null)            // no more stims in experiment
  */
  Stim.one({id: stim_id}, function(err, stim) {
    if (err) return callback(err);

    // uses singleton DB
    db.Select('stims')
    .where('experiment_id = ?', experiment_id)
    .where('view_order > ?', stim.view_order)
    .orderBy('view_order ASC')
    .limit(1)
    .execute(function(err, stims) {
      if (err) return callback(err);
      callback(null, stims.length ? stims[0].id : null);
    });
  });
};

var Participant = exports.Participant = orm.model('participants',
  ['name', 'aws_worker_id', 'aws_bonus_owed', 'aws_bonus_paid', 'ip_address', 'user_agent']);
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
    assignment_id: String, // optional
  }

  callback: function(Error | null, null | inserted_responses_rows)
  */
  Participant.one({aws_worker_id: participant.aws_worker_id}, function(err, existing_participant) {
    if (err) {
      if (err.message && !err.message.match(/Could not find match/)) {
        return callback(err);
      }
      db.Insert('participants')
      .set(participant)
      .execute(function(err, rows) {
        response.participant_id = rows[0].id;
        db.Insert('responses').set(response).execute(callback);
      });
    }
    else {
      response.participant_id = existing_participant.id;
      db.Insert('responses').set(response).execute(callback);
    }
  });
};

var Response = exports.Response = orm.model('responses',
  ['participant_id', 'stim_id', 'value', 'assignment_id']);

var AccessToken = exports.AccessToken = orm.model('access_tokens',
  ['token', 'relation', 'foreign_id', 'expires', 'redacted', 'created']);
AccessToken.check = function(token, relation, foreign_id, callback) {
  var select = db.Select('access_tokens')
  .where('token = ?', token)
  .where('relation = ?', relation)
  .where('(expires IS NULL OR expires > NOW())')
  .where('redacted IS NULL');

  if (foreign_id !== undefined) {
    select = select.where('foreign_id = ?', foreign_id);
  }

  select.execute(function(err, rows) {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No access token matched.'));

    callback(err, rows[0]);
  });
};
AccessToken.findOrCreate = function(relation, foreign_id, opts, callback) {
  /**
  Also overloaded as:
    findOrCreate(relation, foreign_id, callback)

  relation: String (a table name, I would hope)
  foreign_id: Number (pointer to the "id" column on the table denoted by the "relation" field)
  opts:
    length: Number (defaults to 40)
    expires: Date || null
  callback: function(err, token: String)

  */
  if (callback === undefined && typeof opts === 'function') {
    // overload
    callback = opts;
    opts = undefined;
  }
  opts = _.extend({
    length: 40,
    expires: null,
  }, opts);

  db.Select('access_tokens')
  .where('relation = ?', relation)
  .where('foreign_id = ?', foreign_id)
  .where('(expires IS NULL OR expires > NOW())')
  .where('redacted IS NULL')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return callback(err);

    // use existing token
    if (rows.length > 0) {
      return callback(null, rows[0].token);
    }

    var token = lib.randomString(opts.length);

    // insert token
    db.Insert('access_tokens')
    .set({
      token: token,
      relation: relation,
      foreign_id: foreign_id,
      expires: opts.expires,
    })
    .execute(function(err, result) {
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
