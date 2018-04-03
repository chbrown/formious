/**
 * copied from github.com: chbrown/cookies#v1.0.0
 */
import {IncomingMessage, ServerResponse} from 'http'

function asString(value: number | string | string[] | undefined,
                  separator = ','): string {
  if (value === undefined) {
    return undefined
  }
  if (Array.isArray(value)) {
    return value.join(separator)
  }
  if (typeof value == 'number') {
    return value.toString()
  }
  return value
}

export interface Cookie {
  comment?: string
  domain?: string
  max_age?: string
  path?: string
  secure?: boolean
  version?: boolean
  // non-standard
  http_only?: string
  expires?: Date
}

export function serialize(name: string, value: string, cookie: Cookie): string {
  // Going off http://www.ietf.org/rfc/rfc2109.txt
  const parts = [`${name}=${value}`]
  if (cookie.comment) parts.push(`Comment=${cookie.comment}`)
  if (cookie.domain) parts.push(`Domain=${cookie.domain}`)
  if (cookie.max_age) parts.push(`Max-Age=${cookie.max_age}`)
  if (cookie.path) parts.push(`Path=${cookie.path}`)
  if (cookie.secure) parts.push('secure')
  if (cookie.version) parts.push('Version=1') // this is technically required by RFC 2109
  // these are not in RFC 2109
  if (cookie.http_only) parts.push('httponly')
  if (cookie.expires) parts.push(`expires=${cookie.expires.toUTCString()}`)
  return parts.join('; ')
}

class Cookies {
  private cachedCookies: {[index: string]: string}

  constructor(public req: IncomingMessage,
              public res: ServerResponse) { }

  get cookies() {
    if (!this.cachedCookies) {
      // somewhat lazy; we only read the cookies once we need one
      if (!this.req) {
        throw new Error('You must specify at least: new Cookies(IncomingMessage, ...)')
      }
      this.cachedCookies = {}
      const header = asString(this.req.headers.cookie)
      if (header) {
        const cookies = header.split(/;\s*/)
        for (let i = 0, l = cookies.length; i < l; i++) {
          const cookie = cookies[i]
          const splitAt = cookie.indexOf('=')
          const name = cookie.slice(0, splitAt)
          this.cachedCookies[name] = cookie.slice(splitAt + 1)
        }
      }
    }
    return this.cachedCookies
  }

  get(name: string): string {
    return this.cookies[name]
  }

  set(name: string, value: string, opts: Cookie = {}): this {
    if (!this.res) {
      throw new Error('You must specify at least: new Cookies(..., ServerResponse)')
    }
    const queuedHeader = asString(this.res.getHeader('Set-Cookie'))
    const header = queuedHeader ? [queuedHeader] : []

    header.push(serialize(name, value, opts))
    this.res.setHeader('Set-Cookie', header)

    return this // chainable
  }

  del(name: string, opts: Cookie = {expires: new Date(0)}) {
    return this.set(name, '', opts) // chainable
  }
}

export default Cookies
