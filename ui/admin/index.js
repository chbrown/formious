/*jslint browser: true */ /*globals _, mercury */

var log = console.log.bind(console);

// var document = require('global/document');
// var hg = mercury;
var h = mercury.h;

function renderObject(object) {
  // log('renderObject(%o)', object);
  if (object === undefined) {
    return h('i.undefined', 'undefined');
  }
  else if (object === null) {
    return h('b.null', 'null');
  }
  else if (Array.isArray(object)) {
    // TODO: check for tabular arrays (all of the items are objects with the same keys)
    var array_children = object.map(function(value) {
      return renderObject(value);
    });
    return h('div.array', array_children);
  }
  else if (typeof object === 'object') {
    var object_children = _.map(object, function(value, key) {
      return h('tr', [
        h('td', key), h('td', renderObject(value))
      ]);
    });
    return h('div.object', h('table.keyval', object_children));
  }
  else if (typeof object === 'number') {
    return h('b.number', object.toString());
  }
  else if (typeof object === 'boolean') {
    return h('b.boolean', object.toString());
  }
  return h('span.string', object.toString());
}
