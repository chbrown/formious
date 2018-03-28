export interface Row {
  id: number
  name?: string
  access_key_id: string
  secret_access_key: string
  created: Date
}

export default class AWSAccount {
  static columns = [
    'name',
    'access_key_id',
    'secret_access_key',
  ]
}
