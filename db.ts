import {logger} from 'loge'
import {Connection} from 'sqlcmd-pg'

// the DB_PORT_5432_* values come from docker
const db = new Connection({
  host: process.env.DB_PORT_5432_TCP_ADDR || '127.0.0.1',
  port: parseInt(process.env.DB_PORT_5432_TCP_PORT || '5432', 10),
  user: 'postgres',
  database: 'formious',
})

// attach local logger to sqlcmd.Connection log events
db.on('log', (ev) => {
  const args = [ev.format].concat(ev.args)
  logger[ev.level].apply(logger, args)
})

export default db
