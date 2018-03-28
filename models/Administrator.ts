import {createHash} from 'crypto'

import db from '../db'
import AccessToken from './AccessToken'

const salt = 'rNxROdgCbAkBI2WvZJtH'

function sha256(string: string) {
  const shasum = createHash('sha256')
  shasum.update(salt, 'utf8')
  shasum.update(string, 'utf8')
  return shasum.digest('hex')
}

export interface IAdministrator {
  id?: string
  email?: string
  password?: string
  created?: Date
}

export default class Administrator implements IAdministrator {
  id?: string
  email?: string
  password?: string
  created?: Date

  constructor(administrator: IAdministrator) {
    const {id, email, password, created} = administrator
    this.id = id
    this.email = email
    this.password = password
    this.created = created
  }

  static columns = [
    'id',
    'email',
    'password',
    'created',
  ]

  static add(email: string,
             password: string,
             callback: (error: Error, administrator?: Administrator) => void): void {
    db.InsertOne('administrators')
    .set({
      email,
      password: sha256(password),
    })
    .returning('*')
    .execute(callback)
  }

  update(email: string,
         password: string,
         callback: (error: Error, administrator?: Administrator) => void): void {
    let query = db.Update('administrators')
    .setEqual({email})
    .whereEqual({id: this.id})
    .returning('*')

    // empty-string password means: don't change the password
    if (password) {
      query = query.setEqual({password: sha256(password)})
    }

    query.execute((err, rows) => {
      callback(err, err ? null : rows[0])
    })
  }

  /**
  callback signature:
  */
  static authenticate(email: string,
                      password: string,
                      callback: (error: Error, token?: string) => void): void {
    db.SelectOne('administrators')
    .whereEqual({
      email,
      password: sha256(password),
    })
    .execute((err, administrator) => {
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
                   callback: (error: Error, administrator?: Administrator) => void): void {
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
