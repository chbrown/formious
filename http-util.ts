import {parse as parseUrl, format as formatUrl, Url} from 'url'
import {parse as parseQuerystring} from 'querystring'
import {IncomingMessage, ServerResponse} from 'http'
import {readToEnd} from 'streaming'

/**
Opinionated input/form reader
*/
export function readData(req: IncomingMessage,
                         callback: (error: Error, data?: any) => void): void {
  if (req.method == 'GET') {
    const {query} = parseUrl(req.url, true)
    setImmediate(() => callback(null, query))
  }
  else {
    const contentType = req.headers['content-type'] || ''
    readToEnd(req, (err, chunks) => {
      if (err) return callback(err)
      const body = Buffer.concat(chunks)

      if (/application\/json/i.test(contentType)) {
        // empty body translates to null
        if (body.length === 0) {
          callback(null, null)
        }
        else {
          try {
            callback(null, JSON.parse(body.toString()))
          }
          catch (exc) {
            callback(exc)
          }
        }
      }
      else if (/application\/x-www-form-urlencoded/i.test(contentType)) {
        // will querystring.parse ever throw?
        callback(null, parseQuerystring(body.toString())) // assumes utf-8
      }
      else {
        callback(null, body)
      }
    })
  }
}

function pick<T extends {}>(object: T, keys: string[]): Partial<T> {
  const newObject: Partial<T> = {}
  for (const key of keys) {
    newObject[key] = object[key]
  }
  return newObject
}

export function readFields<T extends {}>(req: IncomingMessage,
                                         keys: string[],
                                         callback: (error: Error, fields?: Partial<T>) => void): void {
  return readData(req, (err, data) => {
    if (err) {
      return callback(err)
    }

    return callback(null, pick<T>(data, keys))
  })
}

export function asString(value: string | string[] | number | null | undefined,
                         separator = ','): string {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (Array.isArray(value)) {
    return value.join(separator)
  }
  if (typeof value == 'number') {
    return value.toString()
  }
  return value
}

export function readIPAddress(req: IncomingMessage): string {
  return asString(req.headers['x-real-ip']) || req.connection.remoteAddress
}

export function readUserAgent(req: IncomingMessage): string {
  return asString(req.headers['user-agent'])
}

export function writeJson(res: ServerResponse, value: any): ServerResponse {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(value))
  return res
}

export function writeHtml(res: ServerResponse, html: string): ServerResponse {
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
  return res
}

export function writeText(res: ServerResponse, text: string): ServerResponse {
  res.setHeader('Content-Type', 'text/plain')
  res.end(text)
  return res
}

export function writeError(res: ServerResponse, error: Error): ServerResponse {
  if (res.statusCode == 200) {
    res.statusCode = 500
  }
  const message = error ? error.stack : 'Failure'
  return writeText(res, message)
}

export function writeRedirect(res: ServerResponse,
                              location: string,
                              statusCode: number = 302): ServerResponse {
  res.statusCode = statusCode
  res.setHeader('Location', location)
  res.end(`Redirecting to: ${location}`)
  return res
}

export function writeRelativeRedirect(res: ServerResponse,
                                      req: IncomingMessage,
                                      partialUrlObj: Url): ServerResponse {
  const urlObj = parseUrl(req.url, true)
  const location = formatUrl({...urlObj, ...partialUrlObj})
  // check whether the request originated from the client code (ajax)
  const ajax = asString(req.headers['x-requested-with']) == 'XMLHttpRequest'
  // in ajax mode, return a statusCode of 200, so that the client code
  // can implement custom handling of the redirect header
  return writeRedirect(res, location, ajax ? 200 : 302)
}
