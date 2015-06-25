var sqlorm = require('./sqlorm');
var db = require('../db');

var Participant = sqlorm.createModel(db, 'participants',
  ['name', 'aws_worker_id', 'aws_bonus_owed', 'aws_bonus_paid', 'ip_address', 'user_agent']);

Participant.findOrCreate = function(participant, callback) {
  Participant.one({aws_worker_id: participant.aws_worker_id}, function(err, existing_participant) {
    if (err) {
      if (err.message && !err.message.match(/Could not find match/)) {
        callback(err);
      }
      else {
        Participant.insert(participant, callback);
      }
    }
    else {
      callback(null, existing_participant);
    }
  });
};

/**
participant: {
  aws_worker_id: String, // required
  ip_address: String, // optional
  user_agent: String, // optional
}
response: {
  block_id: Number, // optional
  value: Object, // optional
  assignment_id: String, // optional
}

callback: function(error: Error, participant?: Participant, responses?: Response[])
*/
Participant.addResponse = function(participant, response, callback) {
  Participant.findOrCreate({aws_worker_id: participant.aws_worker_id}, function(err, participant) {
    if (err) return callback(err);

    response.participant_id = participant.id;
    db.Insert('responses')
    .set(response)
    .returning('*')
    .execute(function(err, responses) {
      if (err) return callback(err);

      callback(err, participant, responses);
    });
  });
};

module.exports = Participant;
