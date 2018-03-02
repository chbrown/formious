var _ = require('lodash');
var db = require('../db');
var lib_util = require('../lib/util');

class AccessToken {
  static get columns() {
    return [
      'token',
      'relation',
      'foreign_id',
      'expires',
      'redacted',
      'created',
    ];
  }

  static check(token, relation, foreign_id, callback) {
    var select = db.Select('access_tokens')
    .whereEqual({token: token, relation: relation})
    .where('(expires IS NULL OR expires > NOW())')
    .where('redacted IS NULL');

    if (foreign_id !== undefined) {
      select = select.whereEqual({foreign_id: foreign_id});
    }

    select.execute(function(err, rows) {
      if (err) return callback(err);
      if (rows.length === 0) return callback(new Error('No access token matched.'));

      callback(err, rows[0]);
    });
  }

  /**
  relation: String (a table name, I would hope)
  foreign_id: Number (pointer to the "id" column on the table denoted by the "relation" field)
  options:
    length: Number (defaults to 40)
    expires: Date || null
  callback: function(err, access_token_object: Object)

  */
  static findOrCreate(relation, foreign_id, options, callback) {
    options = _.assign({length: 40, expires: null}, options);

    db.SelectOne('access_tokens')
    .whereEqual({relation: relation, foreign_id: foreign_id})
    .where('(expires IS NULL OR expires > NOW())')
    .where('redacted IS NULL')
    .execute(function(err, access_token) {
      if (err) return callback(err);

      // use existing token
      if (access_token) {
        return callback(null, access_token);
      }

      var token = lib_util.randomString(options.length);
      db.InsertOne('access_tokens')
      .set({
        token: token,
        relation: relation,
        foreign_id: foreign_id,
        expires: options.expires,
      })
      .returning('*')
      .execute(callback);
    });
  }
}

module.exports = AccessToken;
