import {logger, Level} from 'loge'
import {Connection} from 'sqlcmd-pg'

// the DB_PORT_5432_* values come from docker
const db = new Connection({
  host: process.env.DB_PORT_5432_TCP_ADDR || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_5432_TCP_PORT || '5432', 10),
  user: 'postgres',
  database: 'formious',
})

interface LogEvent {
  level: string
  format: string
  args?: any[]
}

function normalize(value: any): any {
  if (typeof value === 'string') {
    return value.replace(/\s{2,}/g, ' ')
  }
  return value
}

// attach local logger to sqlcmd.Connection log events
db.on('log', (ev: LogEvent) => {
  const {level, format, args} = ev
  // normalize each value in args, most of which will be SQL strings
  const normalizedArgs = (args || []).map(normalize)
  logger.log(Level[level], [format, ...normalizedArgs])
})

export default db
