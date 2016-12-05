organization := "com.formious"

name := "app"

version := "0.0.2-SNAPSHOT"

scalaVersion := "2.11.8"

// latest versions in Maven Central as of 2016-09-08 (or later)
libraryDependencies ++=
  Seq("ch.qos.logback" % "logback-classic" % "1.1.7") ++
  Seq("http4s-circe", "http4s-dsl", "http4s-blaze-server").map("org.http4s" %% _ % "0.14.7") ++
  // Circe for JSON parsing/serialization
  Seq("circe-core", "circe-generic", "circe-parser").map("io.circe" %% _ % "0.5.2") ++
  // Database access
  Seq("org.postgresql" % "postgresql" % "9.4.1211") ++
  // Handlebars templates (gilt behaves badly; it shouldn't specify an actual logging library)
  Seq("com.gilt" %% "handlebars-scala" % "2.1.1" exclude("org.slf4j", "slf4j-simple")) ++
  Seq("org.rogach" %% "scallop" % "2.0.2") ++
  Seq("com.typesafe" % "config" % "1.3.0") ++
  // java-aws-mturk from personal bintray
  Seq("com.amazonaws" % "java-aws-mturk" % "1.7.0") ++
  // super-csv for parsing CSV
  Seq("super-csv", "super-csv-java8").map("net.sf.supercsv" % _ % "2.4.0") ++
  // poi-ooxml for parsing Excel spreadsheets
  Seq("org.apache.poi" % "poi-ooxml" % "3.14")

// for java-aws-mturk dependencies
resolvers += "JBoss" at "https://repository.jboss.org/nexus/content/groups/public-jboss"
// for java-aws-mturk
resolvers += Resolver.bintrayRepo("chbrown", "maven")

scalacOptions ++= Seq(
  "-unchecked",
  "-deprecation",
  "-feature",
  "-language:implicitConversions",
  "-language:postfixOps")

// lint
//scalacOptions ++= Seq("-Ywarn-unused", "-Ywarn-unused-import", "-Xlint")

// expose build information to sources
lazy val root = (project in file(".")).
  enablePlugins(BuildInfoPlugin).
  settings(
    buildInfoKeys := Seq[BuildInfoKey](organization, name, version, scalaVersion, sbtVersion, libraryDependencies),
    buildInfoPackage := organization.value ++ "." ++ name.value
  )
