export default class Template {
  id: number
  name: string
  html: string
  created: Date

  static columns = [
    'name',
    'html',
  ]
}
