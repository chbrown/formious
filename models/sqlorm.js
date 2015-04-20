var sqlorm = module.exports = require('sqlorm');

/**
Basically just copy & paste the original insert / update code, but add
returning('*') to the queries.
*/

sqlorm.Model.insert = function(fields, callback) {
  this.db.Insert(this.table)
  .set(fields)
  .returning('*')
  .execute(function(err, rows) {
    if (err) return callback(err);

    callback(null, rows[0]);
  });
};

sqlorm.Model.update = function(setFields, whereFields, callback) {
  this.db.Update(this.table)
  .setEqual(setFields)
  .whereEqual(whereFields)
  .returning('*')
  .execute(function(err, rows) {
    if (err) return callback(err);

    callback(null, rows[0]);
  });
};
