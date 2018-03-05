import Router from 'regex-router'
import {readToEnd} from 'streaming'
import {Parser, ArrayStringifier} from 'streaming/json'
import * as sv from 'sv'

import * as httpUtil from '../http-util'
import {parseXlsx} from '../lib/excel'

const R = new Router()

/** POST /util/parse-table

Parse csv-like input flexibly and write out json to response */
R.post(/\/util\/parse-table/, (req, res) => {
  const content_type = req.headers['content-type']
  if (content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    readToEnd(req, (err, chunks) => {
      if (err) return httpUtil.writeError(res, err)
      const data = Buffer.concat(chunks)

      const objects = parseXlsx(data)
      // const allKeys = Array.prototype.concat(...objects.map(Object.keys))
      // const columns = [...new Set(allKeys)]
      // res.setHeader('X-Columns', columns)
      httpUtil.writeJson(res, objects)
    })
  }
  else {
    // prepare transforms
    const parser = content_type == 'application/json' ? new Parser() : new sv.Parser()
    const stringifier = new ArrayStringifier()
    // set headers
    res.setHeader('content-type', 'application/json')
    // pipe all the streams together
    req.pipe(parser).pipe(stringifier).pipe(res)
  }
})

export default R.route.bind(R)
