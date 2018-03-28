import db from '../db'

export interface Row {
  id: number
  participant_id: number
  block_id: number
  value?: any
  assignment_id?: string
  created?: Date
}

export default class Response {
  static columns = [
    'id',
    'participant_id',
    'block_id',
    'value',
    'assignment_id',
    'created',
  ]
}
