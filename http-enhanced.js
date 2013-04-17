'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var http = require('http');
var util = require('util');

http.ServerResponse.prototype.writeEnd = function(s) { this.write(s); this.end(); };
http.ServerResponse.prototype.writeAll = function(http_code, content_type, body) {
  this.writeHead(http_code, {'Content-Type': content_type});
  this.writeEnd(body);
};
http.ServerResponse.prototype.json = function(obj) {
  var json;
  try {
    json = JSON.stringify(obj);
  }
  catch (exc) {
    json = util.inspect(obj,  {showHidden: true, depth: null});
  }
  this.writeAll(200, 'application/json', json);
};
http.ServerResponse.prototype.text = function(str) {
  this.writeAll(200, 'text/plain', str);
};
http.ServerResponse.prototype.die = function(err) {
  this.writeAll(500, 'text/plain', 'Failure: ' + err.toString());
};

http.ServerResponse.prototype.redirect = function(location) {
  this.writeHead(302, {'Location': location});
  this.writeEnd('Redirecting to: ' + location);
};

module.exports = http;
