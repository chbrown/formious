import db from '../db'

export default class Response {
  id?: number
  participant_id?: number
  block_id?: number
  value?: any
  assignment_id?: string
  created?: Date
}
