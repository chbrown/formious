var sqlorm = require('sqlorm');
var db = require('../db');

var Stim = exports.Stim = sqlorm.createModel(db, 'stims',
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

module.exports = Stim;
