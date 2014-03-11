/*jslint node: true */
/**
Flatten and unflatten json
*/
var _flatten = function(obj, root, result) {
  for (var key in obj) {
    var value = obj[key];
    var path;
    if (Array.isArray(obj)) {
      path = root + '[' + key + ']';
    }
    else {
      path = root ? (root + '.' + key) : key;
    }

    if (value instanceof Object) {
      _flatten(value, path, result);
    }
    else {
      result[path] = value;
    }
  }
};

var flatten = exports.flatten = function(obj) {
  var result = {};
  _flatten(obj, '', result);
  return result;
};

var unflatten = exports.unflatten = function(map) {
  // map will be an Object with basic data types for its values
  var result = {};
  for (var pointer in map) {
    // delimiters can be either periods or [ ] braces
    var index_regex = /(?:^|\.)(\w+)|(\[\d+\])/g;
    // traverse
    var cursor = result;
    var parent_index = null;
    var index;
    var m;
    while ((m = index_regex.exec(pointer))) {
      // objects match as m[1], arrays match as m[2]
      if (m[2]) {
        index = {type: Array, value: parseInt(m[2].slice(1, -1), 10)};
      }
      else {
        index = {type: Object, value: m[1]};
      }
      // index = _parseIndex(m[1]);
      // we'll have parent_index after the first pass
      if (parent_index) {
        if (cursor[parent_index.value] === undefined) {
          cursor[parent_index.value] = (index.type === Array) ? [] : {};
        }
        cursor = cursor[parent_index.value];
      }
      parent_index = index;
    }
    // okay, we're at the leaf, and parent_index === index
    cursor[index.value] = map[pointer];
  }
  return result;
};

function test() {
  var tap = require('tap');

  var customer_orig = {
    customer: {
      firstname: 'Chris',
      lastname: 'Brown',
    },
    purchases: [
      'Crackers',
      'Olive oil',
      'Grapefruit juice',
    ],
    age: 23,
  };

  var customer_flat = {
    'customer.firstname': 'Chris',
    'customer.lastname': 'Brown',
    'purchases[0]': 'Crackers',
    'purchases[1]': 'Olive oil',
    'purchases[2]': 'Grapefruit juice',
    'age': 23,
  };

  tap.test('flatten', function(t) {
    var flattened = flatten(customer_orig);
    t.deepEqual(customer_flat, flattened, 'flatten() should produce prototypical flattening');
    t.end();
  });

  tap.test('unflatten', function(t) {
    var unflattened = unflatten(customer_flat);
    // console.log('input', customer_flat);
    // console.log('output', unflattened);
    t.deepEqual(customer_orig, unflattened, 'unflatten() should produce the deep object');
    t.end();
  });
}

// test();
