export interface Row {
  id: number
  name?: string
  administrator_id: number
  html?: string
  created: Date
}

export default class Experiment {
  static columns = [
    'name',
    'administrator_id',
    'html',
  ]
}
