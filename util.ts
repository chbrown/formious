import {createHash, createCipher} from 'crypto'

/**
This constant was created by calling `openssl rand -hex 32`.
If it's ever used, a warning is generated and logged.
*/
const defaultSecret = Buffer.from('06163e5e76046e13012a916e00fcd8e25836a97a671aa72eb5293ad51aa7e737', 'hex')

function readSecret(environmentVariable: string = 'FORMIOUS_SECRET'): Buffer {
  if (environmentVariable in process.env) {
    const envString = process.env[environmentVariable]
    const encoding = /^[0-9A-Fa-f]+$/.test(envString) ? 'hex' : 'utf8'
    return Buffer.from(envString, encoding)
  }
  console.warn(`Security warning: the "${environmentVariable}" environment variable was not set -- using default secret!`)
  return defaultSecret
}

export function sha256(data: string, encoding: 'utf8' | 'ascii' | 'latin1' = 'utf8'): string {
  const hash = createHash('sha256')
  hash.update(readSecret())
  hash.update(data, encoding)
  return hash.digest('hex')
}

export function blowfish(data: string, encoding: 'utf8' | 'ascii' | 'binary' = 'utf8'): string {
  const cipher = createCipher('bf-cbc', readSecret())
  const prefix = cipher.update(data, encoding)
  const suffix = cipher.final()
  const encrypted = Buffer.concat([prefix, suffix])
  return encrypted.toString('hex')
}
