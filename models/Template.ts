export default class Template {
  id: number
  name: string
  html: string
  created: Date

  static get columns() {
    return [
      'name',
      'html',
    ]
  }
}
