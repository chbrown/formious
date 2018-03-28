import db from '../db'

import Response, {Row as ResponseRow} from './Response'

export interface Row {
  id: number
  name?: string
  aws_worker_id?: string
  aws_bonus_owed?: number
  aws_bonus_paid?: number
  ip_address?: string
  user_agent?: string
  created: Date
}

export default class Participant {
  static findOrCreate(participant: Partial<Row>,
                      callback: (error: Error, participant?: Row) => void): void {
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
   * Find or create a Participant matching the subset of fields provided in
   * {@link participant}, and insert a corresponding Response row in the database.
   */
  static addResponse(participant: Partial<Row> & {aws_worker_id: string},
                     response: Partial<ResponseRow>,
                     callback: (error: Error, participant?: Row, response?: ResponseRow) => void): void {
    Participant.findOrCreate({aws_worker_id: participant.aws_worker_id}, (err, participant) => {
      if (err) return callback(err)

      response.participant_id = participant.id
      db.InsertOne('responses')
      .set(response)
      .returning('*')
      .execute((err, response: ResponseRow) => {
        if (err) return callback(err)

        callback(err, participant, response)
      })
    })
  }
}
