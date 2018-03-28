export interface Row {
  id: number
  name: string
  html?: string
  created: Date
}

export default class Template {
  static columns = [
    'id',
    'name',
    'html',
    'created',
  ]
}
