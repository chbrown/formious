var db = require('../db');

class Participant {
  static findOrCreate(participant, callback) {
    db.SelectOne('participants')
    .whereEqual({aws_worker_id: participant.aws_worker_id})
    .execute(function(err, existing_participant) {
      if (err) return callback(err);

      if (existing_participant) {
        return callback(null, existing_participant);
      }

      db.InsertOne('participants')
      .set({aws_worker_id: participant.aws_worker_id})
      .returning('*')
      .execute(callback);
    });
  }

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
  static addResponse(participant, response, callback) {
    Participant.findOrCreate({aws_worker_id: participant.aws_worker_id}, function(err, participant) {
      if (err) return callback(err);

      response.participant_id = participant.id;
      db.InsertOne('responses')
      .set(response)
      .returning('*')
      .execute(function(err, response) {
        if (err) return callback(err);

        callback(err, participant, response);
      });
    });
  }
}

module.exports = Participant;
