import db from '../db'

export interface AccessTokenOptions {
  length?: number
  expires?: Date
}

export default class AccessToken {
  id: number
  token: string
  relation: string
  foreign_id: number
  expires?: Date
  redacted?: Date
  created: Date

  static columns = [
    'token',
    'relation',
    'foreign_id',
    'expires',
    'redacted',
    'created',
  ]

  static randomString(length: number) {
    const store = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const chars: string[] = []
    for (let i = 0; i < length; i++) {
      chars.push(store[Math.random() * store.length | 0])
    }
    return chars.join('')
  }

  static check(token: string,
               relation: string,
               foreign_id: string,
               callback: (error: Error, accessToken?: AccessToken) => void): void {
    let select = db.Select('access_tokens')
    .whereEqual({token, relation})
    .where('(expires IS NULL OR expires > NOW())')
    .where('redacted IS NULL')

    if (foreign_id !== undefined) {
      select = select.whereEqual({foreign_id})
    }

    select.execute((err, rows) => {
      if (err) return callback(err)
      if (rows.length === 0) return callback(new Error('No access token matched.'))

      callback(err, rows[0])
    })
  }

  /**
   * @param relation - A table name, presumably
   * @param foreign_id - Value of the `id PRIMARY KEY` column on the table
   *        denoted by {@link relation}
   * @param [options.length=40] - The length of the token to create (if needed)
   * @param [options.expires=null] - When the created token should expire
   */
  static findOrCreate(relation: string,
                      foreign_id: string,
                      options: AccessTokenOptions,
                      callback: (error: Error, accessToken?: AccessToken) => void): void {
    const {expires = null, length = 40} = options
    db.SelectOne('access_tokens')
    .whereEqual({relation, foreign_id})
    .where('(expires IS NULL OR expires > NOW())')
    .where('redacted IS NULL')
    .execute((err, accessToken) => {
      if (err) return callback(err)

      // use existing token
      if (accessToken) {
        return callback(null, accessToken)
      }

      const token = AccessToken.randomString(length || 40)
      db.InsertOne('access_tokens')
      .set({token, relation, foreign_id, expires})
      .returning('*')
      .execute(callback)
    })
  }
}
