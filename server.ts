import * as path from 'path'
import * as program from 'commander'

import * as http from 'http'
import {logger, Level} from 'loge'
import {executePatches} from 'sql-patch'

import controllers from './controllers'
import db from './db'
import Administrator from './models/Administrator'

export const server = http.createServer((req, res) => {
  logger.debug('%s %s', req.method, req.url)
  controllers(req, res)
})

server.on('listening', () => {
  const address = server.address()
  logger.info('server listening on http://%s:%d', address.address, address.port)
})

function readPassword(tty: NodeJS.ReadStream, callback: (error: Error, password: string) => void) {
  const chars: string[] = []
  tty.setRawMode(true) // to get input character by character
  tty.on('readable', () => {
    const chunk = tty.read()
    if (chunk !== null) {
      const char = chunk.toString()
      chars.push(char)
      if (char == '\n' || char == '\r' || char == '\x04') {
        tty.setRawMode(false)
        callback(null, chars.join(''))
      }
      else {
        process.stdout.write('*')
      }
    }
  })
}

function migrate(callback: (error: Error) => void) {
  db.createDatabaseIfNotExists(createDbError => {
    if (createDbError) return callback(createDbError)
    const migrations_dirpath = path.join(__dirname, 'migrations')
    executePatches(db, '_migrations', migrations_dirpath, migrationError => {
      return callback(migrationError)
    })
  })
}

export function main() {
  program
  .version(require('./package').version)
  .option('-v, --verbose', 'print extra output', process.env.DEBUG !== undefined)
  // .usage('--port 1451 -v')

  // set up 'server' command
  program
  .command('server')
  .option('--hostname <name or ip>', 'hostname to listen on', process.env.HOSTNAME || '127.0.0.1')
  .option('--port <integer>', 'port to listen on', s => parseInt(s, 10), process.env.PORT || '80')
  .action(options => {
    server.listen(options.port, options.hostname)
  })

  // set up 'migrate' command
  program
  .command('migrate')
  .action(options => {
    migrate(err => {
      if (err) throw err
      process.exit(0)
    })
  })

  // set up 'configure-administrator' command
  program
  .command('configure-administrator <email>')
  .action(email => {
    process.stdout.write('Enter password: ')
    readPassword(process.stdin, (stdinError, rawPassword) => {
      if (stdinError) throw stdinError
      process.stdout.write('\n')
      Administrator.upsert(email, rawPassword, (upsertError, administrator) => {
        if (upsertError) throw upsertError
        console.log('Administrator:', administrator)
        process.exit(0)
      })
    })
  })

  program.parse(process.argv)
  logger.level = program.verbose ? Level.debug : Level.info
}

export default server
