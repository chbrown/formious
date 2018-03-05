import * as path from 'path'
import * as optimist from 'optimist'

import * as http from 'http'
import {logger, Level} from 'loge'
import {executePatches} from 'sql-patch'

import controllers from './controllers'
import db from './db'

export const server = http.createServer((req, res) => {
  logger.debug('%s %s', req.method, req.url)
  controllers(req, res)
})

server.on('listening', () => {
  const address = server.address()
  logger.info('server listening on http://%s:%d', address.address, address.port)
})

interface CLIArgv {
  hostname: string
  port: string
  help: boolean
  verbose: boolean
  version: boolean
}

export function main() {
  const argvparser = optimist
  .usage('formious --port 1451 -v')
  .describe({
    hostname: 'hostname to listen on',
    port: 'port to listen on',
    help: 'print this help message',
    verbose: 'print extra output',
    version: 'print version',
  })
  .boolean(['help', 'verbose', 'version'])
  .alias({verbose: 'v'})
  .default({
    hostname: process.env.HOSTNAME || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 80,
    verbose: process.env.DEBUG !== undefined,
  })

  const argv: CLIArgv = argvparser.argv
  logger.level = argv.verbose ? Level.debug : Level.info

  if (argv.help) {
    argvparser.showHelp()
  }
  else if (argv.version) {
    console.log(require('./package').version)
  }
  else {
    db.createDatabaseIfNotExists((err) => {
      if (err) throw err

      const migrations_dirpath = path.join(__dirname, 'migrations')
      executePatches(db, '_migrations', migrations_dirpath, (err) => {
        if (err) throw err

        server.listen(parseInt(argv.port, 10), argv.hostname)
      })
    })
  }
}

export default server
