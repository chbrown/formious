package com.formious.common

import java.sql._

import org.postgresql.ds.PGPoolingDataSource
import java.time.ZonedDateTime

import org.slf4j.LoggerFactory

import scala.collection.mutable.ListBuffer
import com.formious.common.Recoders._

object Database {
  // TODO: use the docker environment variables if supplied:
  //  DB_PORT_5432_TCP_ADDR || '127.0.0.1'
  //  DB_PORT_5432_TCP_PORT || '5432'
  // TODO: maybe always set user to 'postgres'?
  val username = System.getProperty("user.name")

  //singleton connection
  //val jdbcUrl = "jdbc:postgresql://127.0.0.1/formious"
  //val connection = DriverManager.getConnection(jdbcUrl)

  val source = new PGPoolingDataSource()
  source.setDataSourceName("com.formious.PrimaryDataSource")
  source.setServerName("127.0.0.1")
  source.setDatabaseName("formious")
  source.setLogLevel(org.postgresql.Driver.DEBUG)
  source.setMaxConnections(10)

  val sourcePrintWriter = new java.io.PrintWriter(Console.err)
  // I don't know that this is even used for anything, though
  source.setLogWriter(sourcePrintWriter)

  private val logger = LoggerFactory.getLogger("com.formious.sql")

  /**
    * Wrap the given block in a try-finally to ensure we close the connection, no matter what
    */
  private def withConnection[A](fn: (Connection) => A): A = {
    val connection = source.getConnection()
    try {
      fn(connection)
    }
    finally {
      connection.close()
    }
  }

  /**
    * Wrap the given block in a try-finally to ensure we close the statement (and its connection)
    *
    * PreparedStatement version
    */
  private def withPreparedStatement[A](sql: String, values: Seq[Any])(fn: (PreparedStatement) => A): A = {
    withConnection { connection =>
      val statement = connection.prepareStatement(sql)
      try {
        values.zip(1 to values.size).foreach { case (richValue, index) =>
          // unpack Option (Some/None) into plain Java null or its inner value
          val value: Any = if (richValue.isInstanceOf[Option[_]]) {
            richValue match {
              case Some(rawValue) => rawValue
              case _ => null
            }
          }
          else {
            richValue
          }
          value match {
            case int: Int =>
              statement.setInt(index, int)
            case long: Long =>
              statement.setLong(index, long)
            case double: Double =>
              statement.setDouble(index, double)
            case boolean: Boolean =>
              statement.setBoolean(index, boolean)
            case zonedDateTime: ZonedDateTime =>
              statement.setTimestamp(index, zonedDateTime.toTimestamp)
            case string: String =>
              statement.setString(index, string)
            case null =>
              statement.setNull(index, Types.NULL)
            case _ =>
              throw new Exception(s"Cannot setParameter #$index (${value.getClass}}): $value")
          }
        }
        fn(statement)
      }
      finally {
        statement.close()
      }
    }
  }
  /**
    * Wrap the given block in a try-finally to ensure we close the statement (and its connection)
    *
    * (Plain) Statement version
    */
  private def withStatement[A](fn: (Statement) => A): A = {
    withConnection { connection =>
      val statement = connection.createStatement()
      try {
        fn(statement)
      }
      finally {
        statement.close()
      }
    }
  }

  private def readResultSet[T](resultSet: ResultSet, mapper: ResultSet => T): List[T] = {
    val results = ListBuffer.empty[T]
    while (resultSet.next()) {
      results += mapper(resultSet)
    }
    resultSet.close()
    results.toList
  }

  def query[T](sql: String, values: Seq[Any])(mapper: ResultSet => T): List[T] = {
    logger.debug(s"query(${sql.replaceAll("\\s+", " ")}, {})", values.map(_.toString).mkString(", "))
    withPreparedStatement(sql, values) { statement =>
      val resultSet = statement.executeQuery()
      readResultSet(resultSet, mapper)
    }
  }
  def query[T](sql: String)(mapper: ResultSet => T): List[T] = {
    logger.debug("query({})", sql.replaceAll("\\s+", " "))
    withStatement { statement =>
      val resultSet = statement.executeQuery(sql)
      readResultSet(resultSet, mapper)
    }
  }

  def execute[T](sql: String, values: Seq[Any]): Int = {
    withPreparedStatement(sql, values) { statement =>
      statement.executeUpdate()
    }
  }
  def execute[T](sql: String): Int = {
    withStatement { statement =>
      statement.executeUpdate(sql)
    }
  }
}
