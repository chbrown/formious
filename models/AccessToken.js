var sqlorm = require('./sqlorm');
var db = require('../db');

var util = require('util-enhanced');

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
};
/**
relation: String (a table name, I would hope)
foreign_id: Number (pointer to the "id" column on the table denoted by the "relation" field)
options:
  length: Number (defaults to 40)
  expires: Date || null
callback: function(err, access_token_object: Object)

*/
AccessToken.findOrCreate = function(relation, foreign_id, options, callback) {
  options = util.extend({length: 40, expires: null}, options);

  db.Select('access_tokens')
  .whereEqual({relation: relation, foreign_id: foreign_id})
  .where('(expires IS NULL OR expires > NOW())')
  .where('redacted IS NULL')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return callback(err);

    // use existing token
    if (rows.length > 0) {
      return callback(null, rows[0]);
    }

    var token = randomString(options.length);
    AccessToken.insert({
      token: token,
      relation: relation,
      foreign_id: foreign_id,
      expires: options.expires,
    }, callback);
  });
};

module.exports = AccessToken;
