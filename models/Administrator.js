var crypto = require('crypto');

var db = require('../db');
var AccessToken = require('./AccessToken');

var salt = 'rNxROdgCbAkBI2WvZJtH';

function sha256(string) {
  var shasum = crypto.createHash('sha256');
  shasum.update(salt, 'utf8');
  shasum.update(string, 'utf8');
  return shasum.digest('hex');
}

function Administrator() { }

Administrator.add = function(email, password, callback) {
  db.InsertOne('administrators')
  .set({
    email: email,
    password: sha256(password),
  })
  .returning('*')
  .execute(function(err, administrator) {
    callback(err, administrator);
  });
};

Administrator.prototype.update = function(email, password, callback) {
  var query = db.Update('administrators')
  .setEqual({email: email})
  .whereEqual({id: this.id})
  .returning('*');

  // empty-string password means: don't change the password
  if (password) {
    query = query.setEqual({password: sha256(password)});
  }

  query.execute(function(err, rows) {
    callback(err, err ? null : rows[0]);
  });
};

/**
callback signature: function(Error | null, token | null)
*/
Administrator.authenticate = function(email, password, callback) {
  db.SelectOne('administrators')
  .whereEqual({
    email: email,
    password: sha256(password),
  })
  .execute(function(err, administrator) {
    if (err) return callback(err);
    if (!administrator) return callback(new Error('Authentication failed'));

    AccessToken.findOrCreate('administrators', administrator.id, {length: 40}, function(err, access_token) {
      if (err) return callback(err);

      // logger.info('Authenticated administrator %d and inserted token "%s"', administrator.id, access_token.token);
      return callback(null, access_token.token);
    });
  });
};

/** Get administrator object from token.

callback signature: function(err, user || null)
*/
Administrator.fromToken = function(token, callback) {
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

    db.SelectOne('administrators')
    .add('id', 'email')
    .where('id = ?', rows[0].foreign_id)
    .execute(function(err, administrator) {
      if (err) return callback(err);
      if (!administrator) {
        var message = 'Could not find administrator for token.';
        return callback(new Error(message));
      }
      callback(null, administrator);
    });
  });
};

module.exports = Administrator;
