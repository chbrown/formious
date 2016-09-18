organization := "com.formious"

name := "app"

version := "0.0.1-SNAPSHOT"

scalaVersion := "2.11.8"

// latest versions in Maven Central as of 2016-09-08 (or later)
libraryDependencies ++=
  // Finch
  Seq("finch-core", "finch-circe").map("com.github.finagle" %% _ % "0.11.0-M3") ++
  // Circe
  Seq("circe-core", "circe-generic", "circe-parser").map("io.circe" %% _ % "0.5.2") ++
  // Database access (jsr310 for Java 8 time support)
  Seq("scalikejdbc", "scalikejdbc-jsr310").map("org.scalikejdbc" %% _ % "2.4.2") ++
  Seq("org.postgresql" % "postgresql" % "9.4.1211") ++
  // Handlebars templates
  Seq("com.gilt" %% "handlebars-scala" % "2.1.1") ++
  Seq("org.rogach" %% "scallop" % "2.0.2") ++
  Seq("com.typesafe" % "config" % "1.3.0") ++
  Seq("super-csv", "super-csv-java8").map("net.sf.supercsv" % _ % "2.4.0") ++
  Seq("org.apache.poi" % "poi-ooxml" % "3.14")

scalacOptions ++= Seq(
  "-unchecked",
  "-deprecation",
  "-feature",
  "-language:implicitConversions",
  "-language:postfixOps")

// expose build information to sources
lazy val root = (project in file(".")).
  enablePlugins(BuildInfoPlugin).
  settings(
    buildInfoKeys := Seq[BuildInfoKey](organization, name, version, scalaVersion, sbtVersion, libraryDependencies),
    buildInfoPackage := organization.value ++ "." ++ name.value
  )
