export default class Experiment {
  id?: number
  name?: string
  administrator_id?: number
  html?: string
  created?: Date

  static columns = [
    'name',
    'administrator_id',
    'html',
  ]
}
