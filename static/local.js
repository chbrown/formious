/*jslint browser: true */ /*globals _ */
function time() { return (new Date()).getTime(); }
var p = console.log.bind(console);
var pushAll = function(array, xs) { return Array.prototype.push.apply(array, xs); };
var flatten = function(xs) { return Array.prototype.concat.apply([], xs); };

function makeTable(cols, rows) {
  /** cols is a list of strings, rows is a list of objects, whose keys are cols */
  var thead = '<thead><tr><th>' + cols.join('</th><th>') + '</th></tr></thead>';
  var trs = rows.map(function(cells) {
    return '<td>' + cells.join('</td><td>') + '</td>';
  });
  var tbody = '<tbody><tr>' + trs.join('</tr><tr>') + '</tr></tbody>';
  return '<table>' + thead + tbody + '</table>';
}

function tabulate(objects, keys) {
  // convert a list of objects to flat rows, using the given list of keys, then render them to a table.
  var rows = objects.map(function(object) {
    return keys.map(function(key) {
      return object[key];
    });
  });
  return makeTable(keys, rows);
}

function fileinputText(input, callback) {
  // callback: function(Error | null, file_contents, file_name, file_size)
  var files = input.files;
  var file = files[0];
  var reader = new FileReader();
  reader.onerror = function(err) {
    callback(err, null, file ? file.name : undefined, file ? file.size : undefined);
  };
  reader.onload = function(progress_event) {
    callback(null, progress_event.target.result, file.name, file.size);
  };
  reader.readAsText(file); //, opt_encoding
}

var toMap = function(array, key, value) {
  var map = {};
  array.forEach(function(item) {
    map[item[key]] = item[value];
  });
  return map;
};

var valueWhere = function(list, predicate, prop) {
  var match = _.findWhere(list, predicate);
  if (match) {
    return match[prop];
  }
};

Error.stackTraceLimit = 50;
