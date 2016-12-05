package com.formious.common

import io.circe.JsonObject

object JsonUtil {
  def mergeJsonObjects(a: JsonObject, b: JsonObject): JsonObject = {
    b.toList.foldLeft(a) { case (accumulator, (key, value)) =>
      accumulator.add(key, value)
    }
  }
  def mergeJsonObjects(objects: Iterable[JsonObject]): JsonObject = {
    objects.tail.foldLeft(objects.head)(mergeJsonObjects)
  }
}
