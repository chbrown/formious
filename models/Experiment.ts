export default class Experiment {
  id?: number
  name?: string
  administrator_id?: number
  html?: string
  created?: Date

  static get columns() {
    return [
      'name',
      'administrator_id',
      'html',
    ]
  }
}
