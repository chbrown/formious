/*jslint node: true */
var util = require('util');
var sv = require('sv');

var Tabulator = exports.Tabulator = function(opts) {
  sv.Stringifier.call(this, {
    objectMode: true,
  });
  this.push('<table>' + this.newline, this.encoding);
};
util.inherits(Tabulator, sv.Stringifier);
Tabulator.prototype._line = function(obj) {
  // _write is already a thing, so don't use it.
  // this.columns must be set!
  this.push('<tr>', this.encoding);
  if (typeof(obj) === 'string') {
    // raw string
    this.push('<td colspan="' + this.columns.length + '">' + obj + '</td>', this.encoding);
  }
  else {
    // if obj is an array, we ignore this.columns
    var length = obj.length;
    if (!util.isArray(obj)) {
      // object
      length = this.columns.length;
      var list = new Array(length);
      for (var i = 0; i < length; i++) {
        list[i] = obj[this.columns[i]] || this.missing;
      }
      obj = list;
    }
    for (var j = 0; j < length; j++) {
      this.push('<td>' + obj[j].toString() + '</td>', this.encoding);
    }
  }
  this.push('</tr>' + this.newline, this.encoding);
};
Tabulator.prototype._flush = function(callback) {
  var self = this;
  this.flush.call(this, function() {
    self.push('</table>' + self.newline);
    callback();
  });
};
