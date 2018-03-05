import db from '../db'

import Response from './Response'

export default class Participant {
  id?: number
  name?: string
  aws_worker_id?: string
  aws_bonus_owed?: number
  aws_bonus_paid?: number
  ip_address?: string
  user_agent?: string
  created?: Date

  static findOrCreate(participant: Participant,
                      callback: (error: Error, participant?: Participant) => void): void {
    db.SelectOne('participants')
    .whereEqual({aws_worker_id: participant.aws_worker_id})
    .execute((err, existing_participant) => {
      if (err) return callback(err)

      if (existing_participant) {
        return callback(null, existing_participant)
      }

      db.InsertOne('participants')
      .set({aws_worker_id: participant.aws_worker_id})
      .returning('*')
      .execute(callback)
    })
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
  */
  static addResponse(participant: Participant,
                     response: Response,
                     callback: (error: Error, participant?: Participant, response?: Response) => void): void {
    Participant.findOrCreate({aws_worker_id: participant.aws_worker_id}, (err, participant) => {
      if (err) return callback(err)

      response.participant_id = participant.id
      db.InsertOne('responses')
      .set(response)
      .returning('*')
      .execute((err, response: Response) => {
        if (err) return callback(err)

        callback(err, participant, response)
      })
    })
  }
}
