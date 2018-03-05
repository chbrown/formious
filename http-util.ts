import {parse as parseUrl} from 'url'
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

function asString(value: string | string[] | undefined,
                  separator = ','): string {
  if (value === undefined) {
    return undefined
  }
  if (Array.isArray(value)) {
    return value.join(separator)
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

export function writeRedirect(res: ServerResponse, location: string): ServerResponse {
  if (res.statusCode == 200) {
    res.statusCode = 302
  }
  res.setHeader('Location', location)
  res.end(`Redirecting to: ${location}`)
  return res
}
