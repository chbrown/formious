import db from '../db'
import {sha256} from '../util'
import AccessToken from './AccessToken'

export interface Row {
  id: number
  email: string
  password: string
  created: Date
}

export default class Administrator {
  static columns = [
    'id',
    'email',
    'password',
    'created',
  ]

  static add(email: string,
             passwordRaw: string,
             callback: (error: Error, administrator?: Row) => void): void {
    const password = sha256(passwordRaw)
    db.InsertOne('administrators')
    .set({email, password})
    .returning('*')
    .execute(callback)
  }

  static update(id: number,
                email: string,
                passwordRaw: string,
                callback: (error: Error, administrator?: Row) => void): void {
    let query = db.Update('administrators')
    .setEqual({email})
    .whereEqual({id})
    .returning('*')

    // empty-string password means: don't change the password
    if (passwordRaw) {
      const password = sha256(passwordRaw)
      query = query.setEqual({password})
    }

    query.execute((err, rows) => {
      callback(err, err ? null : rows[0])
    })
  }

  static authenticate(email: string,
                      passwordRaw: string,
                      callback: (error: Error, token?: string) => void): void {
    const password = sha256(passwordRaw)
    db.SelectOne('administrators')
    .whereEqual({email, password})
    .execute((err, administrator: Row) => {
      if (err) return callback(err)
      if (!administrator) return callback(new Error('Authentication failed'))

      AccessToken.findOrCreate('administrators', administrator.id, {length: 40}, (err, access_token) => {
        if (err) return callback(err)

        // logger.info('Authenticated administrator %d and inserted token "%s"', administrator.id, access_token.token)
        return callback(null, access_token.token)
      })
    })
  }

  /**
  Get administrator object from token.
  */
  static fromToken(token: string,
                   callback: (error: Error, administrator?: Row) => void): void {
    db.Select('access_tokens')
    .where('token = ?', token || '')
    .where('relation = ?', 'administrators')
    .where('(expires IS NULL OR expires > NOW())')
    .execute((err, rows) => {
      if (err) return callback(err)
      if (rows.length === 0) return callback(new Error('No access token matched.'))

      db.SelectOne('administrators')
      .add('id', 'email')
      .where('id = ?', rows[0].foreign_id)
      .execute((err, administrator) => {
        if (err) return callback(err)
        if (!administrator) {
          const message = 'Could not find administrator for token.'
          return callback(new Error(message))
        }
        callback(null, administrator)
      })
    })
  }
}
