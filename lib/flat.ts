/**
Flatten and unflatten json
*/
function _flatten(obj, root, result) {
  for (var key in obj) {
    var value = obj[key]
    var path
    if (Array.isArray(obj)) {
      path = root + '[' + key + ']'
    }
    else {
      path = root ? root + '.' + key : key
    }

    if (value instanceof Object) {
      _flatten(value, path, result)
    }
    else {
      result[path] = value
    }
  }
}

function flatten(obj) {
  var result = {}
  _flatten(obj, '', result)
  return result
}
exports.flatten = flatten

function unflatten(map) {
  // map will be an Object with basic data types for its values
  var result = {}
  for (var pointer in map) {
    // delimiters can be either periods or [ ] braces
    var index_regex = /(?:^|\.)(\w+)|(\[\d+\])/g
    // traverse
    var cursor = result
    var parent_index = null
    var index
    var m
    while (m = index_regex.exec(pointer)) { // eslint-disable-line no-cond-assign
      // objects match as m[1], arrays match as m[2]
      if (m[2]) {
        index = {type: Array, value: parseInt(m[2].slice(1, -1), 10)}
      }
      else {
        index = {type: Object, value: m[1]}
      }
      // index = _parseIndex(m[1])
      // we'll have parent_index after the first pass
      if (parent_index) {
        if (cursor[parent_index.value] === undefined) {
          cursor[parent_index.value] = index.type === Array ? [] : {}
        }
        cursor = cursor[parent_index.value]
      }
      parent_index = index
    }
    // okay, we're at the leaf, and parent_index === index
    cursor[index.value] = map[pointer]
  }
  return result
}
exports.unflatten = unflatten
