class AWSAccount {
  static get columns() {
    return [
      'name',
      'access_key_id',
      'secret_access_key',
    ]
  }
}

module.exports = AWSAccount
