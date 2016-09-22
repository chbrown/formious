package com.formious.services

import java.io.FileInputStream
import java.nio.file.Paths

import com.twitter.io.{Buf, Reader}
import io.finch._

object ui {
  val extensions = Map(
    ".css" -> "text/css",
    ".html" -> "text/html",
    ".js" -> "application/javascript"
  )

  def guessContentType(name: String) = {
    // TODO: make lazy
    extensions.flatMap { case (extension, contentType) =>
      if (name.endsWith(extension))
        List(contentType)
      else
        Nil
    }.headOption
  }

  val uiRoot = Paths.get("ui")
  // serve the static files as suggested by:
  // https://github.com/finagle/finch/blob/master/docs/cookbook.md#serving-static-content ?
  val uiFiles: Endpoint[Buf] = get("ui" :: strings) { (parts: Seq[String]) =>
    Console.err.println(s"Finding static file for parts=$parts")
    val fullPath = uiRoot.resolve(Paths.get(parts.head, parts.tail: _*))
    //val inputStream = new BufferedInputStream(new FileInputStream(fullPath.toFile))
    val inputStream = new FileInputStream(fullPath.toFile)
    // Files.probeContentType(fullPath) doesn't seem to work
    // It's supposedly based off $JAVA_HOME/jre/lib/content-types.properties,
    // but doesn't even handle the extensions listed in there
    // URLConnection.guessContentTypeFromStream(inputStream) doesn't work
    // URLConnection.guessContentTypeFromName(fullPath) ? didn't try
    val contentType = guessContentType(fullPath.toString).getOrElse("text/plain")
    //Console.err.println(s"Inferred contentType='$contentType' for $fullPath")
    // TODO: check that file exists and is not a directory
    val reader = Reader.fromStream(inputStream)
    Reader.readAll(reader).map(Ok(_).withHeader("Content-Type" -> contentType))
  }

  val service = uiFiles.toServiceAs[Text.Plain]
}
