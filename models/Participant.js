var sqlorm = require('sqlorm');
var db = require('../db');

var Participant = sqlorm.createModel(db, 'participants',
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

module.exports = Participant;
