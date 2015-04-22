/*jslint browser: true */ /*globals _, mercury */
var h = mercury.h;
var log = console.log.bind(console);
var pushAll = function(array, xs) { return Array.prototype.push.apply(array, xs); };

function renderObject(object) {
  if (object === undefined) {
    return h('i.undefined', 'undefined');
  }
  else if (object === null) {
    return h('b.null', 'null');
  }
  else if (Array.isArray(object)) {
    // check for tabular arrays (all of the items are objects with the same keys)
    var items_are_objects = object.every(function(value) {
      return (value !== null) && (value !== undefined) && (typeof value === 'object');
    });
    if (object.length > 0 && items_are_objects) {
      // now check that all the keys are the same
      var columns = Object.keys(object[0]);
      var items_have_indentical_keys = object.slice(1).every(function(value) {
        // log('eq %o = %o', value, columns);
        return _.isEqual(Object.keys(value), columns);
      });
      if (items_have_indentical_keys) {
        var thead_children = h('tr', columns.map(function(column) {
          return h('th', column);
        }));
        var tbody_children = object.map(function(value) {
          var cells = columns.map(function(column) {
            return h('td', renderObject(value[column]));
          });
          return h('tr', cells);
        });
        return h('div.table', [
          h('table', [
            h('thead', thead_children),
            h('tbody', tbody_children),
          ])
        ]);
      }
    }
    // otherwise, it's an array of arbitrary objects
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
