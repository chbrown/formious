import {createHash} from 'crypto'

/**
This constant was created by calling `openssl rand -hex 32`.
If it's ever used, a warning is generated and logged.
*/
const defaultSalt = Buffer.from('06163e5e76046e13012a916e00fcd8e25836a97a671aa72eb5293ad51aa7e737', 'hex')

export function readSalt(environmentVariable: string = 'FORMIOUS_SALT'): Buffer {
  if (environmentVariable in process.env) {
    const saltString = process.env[environmentVariable]
    const encoding = /^[0-9A-Fa-f]+$/.test(saltString) ? 'hex' : 'utf8'
    return Buffer.from(saltString, encoding)
  }
  console.warn(`Security warning: the "${environmentVariable}" environment variable was not set -- using default salt!`)
  return defaultSalt
}

export function sha256(data: string, encoding: 'utf8' | 'ascii' | 'latin1' = 'utf8') {
  const hash = createHash('sha256')
  hash.update(readSalt())
  hash.update(data, encoding)
  return hash.digest('hex')
}
