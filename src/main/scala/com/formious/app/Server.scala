package com.formious.app

import org.rogach.scallop.ScallopConf
import scalikejdbc._
import com.twitter.finagle.Http
import com.twitter.util.Await

import com.formious.services

object Server {
  // TODO: use the docker environment variables if supplied:
  //  DB_PORT_5432_TCP_ADDR || '127.0.0.1'
  //  DB_PORT_5432_TCP_PORT || '5432'
  // TODO: maybe always set user to 'postgres'?
  ConnectionPool.singleton("jdbc:postgresql:formious", System.getProperty("user.name"), "")
  GlobalSettings.loggingSQLAndTime = LoggingSQLAndTimeSettings(singleLineMode = true)

  def main(args: Array[String]): Unit = {
    object opts extends ScallopConf(args.toSeq) {
      appendDefaultToDescription = true
      banner("formious --port 1451 -v")

      val hostname = opt[String]("hostname", descr="hostname to listen on",
        default=Some(sys.env.getOrElse("HOSTNAME", "127.0.0.1")))
      val port = opt[String]("port", 'p', descr="port to listen on",
        default=Some(sys.env.getOrElse("PORT", "80")))
      val verbose = opt[Boolean]("verbose", 'v', descr="print extra output") // process.env.DEBUG !== undefined
      val version = opt[Boolean]("version", descr="print version")
      // val help = opt[Boolean]("help", "print this help message")
      verify()
    }
    val hostname = opts.hostname()
    val port = opts.port()

    // TODO: set logging level depending on opts.verbose()
    Console.err.println(s"Starting TwitterServer listening on http://$hostname:$port")
    val server = Http.server.serve(s":$port", services.router.service)

    Console.err.println("Waiting for HTTP server to die")
    Await.ready(server)
  }
}
