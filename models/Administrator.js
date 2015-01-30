/*jslint node: true */
var crypto = require('crypto');
var sqlorm = require('sqlorm');
var db = require('../db');

var AccessToken = require('./AccessToken');

var salt = 'rNxROdgCbAkBI2WvZJtH';

function sha256(string) {
  var shasum = crypto.createHash('sha256');
  shasum.update(salt, 'utf8');
  shasum.update(string, 'utf8');
  return shasum.digest('hex');
}

var Administrator = sqlorm.createModel(db, 'administrators',
  ['email', 'password']);

Administrator.authenticate = function(email, password, callback) {
  // callback signature: function(Error | null, token | null)
  // logger.debug('Authenticating where email = %s', email);

  this.one({
    email: email,
    password: sha256(password),
  }, function(err, administrator) {
    if (err) return callback(err);

    AccessToken.findOrCreate('administrators', administrator.id, {length: 40}, function(err, access_token) {
      if (err) return callback(err);

      // logger.info('Authenticated administrator %d and inserted token "%s"', administrator.id, access_token.token);
      return callback(null, access_token.token);
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

module.exports = Administrator;
