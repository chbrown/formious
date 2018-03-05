/**
Flatten and unflatten json
*/
function _flatten(obj: any, root: any, result: any) {
  for (let key in obj) {
    const value = obj[key]
    let path
    if (Array.isArray(obj)) {
      path = `${root}[${key}]`
    }
    else {
      path = root ? `${root}.${key}` : key
    }

    if (value instanceof Object) {
      _flatten(value, path, result)
    }
    else {
      result[path] = value
    }
  }
}

export function flatten(obj: any) {
  const result: any = {}
  _flatten(obj, '', result)
  return result
}

export function unflatten(map: any) {
  // map will be an Object with basic data types for its values
  const result: any = {}
  for (let pointer in map) {
    // delimiters can be either periods or [ ] braces
    const index_regex = /(?:^|\.)(\w+)|(\[\d+\])/g
    // traverse
    let cursor = result
    let parent_index = null
    let index
    let m
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
