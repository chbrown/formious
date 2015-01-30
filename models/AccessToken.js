/*jslint node: true */
var sqlorm = require('sqlorm');
var util = require('util-enhanced');
var db = require('../db');

function randomString(length) {
  var store = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += store[(Math.random() * store.length) | 0];
  }
  return result;
}

var AccessToken = sqlorm.createModel(db, 'access_tokens',
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
  callback: function(err, access_token_object: Object)

  */
  if (callback === undefined && typeof opts === 'function') {
    // overload
    callback = opts;
    opts = undefined;
  }
  opts = util.extend({
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
      return callback(null, rows[0]);
    }

    var token = randomString(opts.length);

    // insert token
    db.Insert('access_tokens')
    .set({
      token: token,
      relation: relation,
      foreign_id: foreign_id,
      expires: opts.expires,
    })
    .execute(function(err, rows) {
      if (err) return callback(err);

      var access_token = rows[0];
      return callback(null, access_token);
    });
  });
};

module.exports = AccessToken;
