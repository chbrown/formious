var http = require('http');

http.ServerResponse.prototype.writeEnd = function(s) { this.write(s); this.end(); };
http.ServerResponse.prototype.writeAll = function(http_code, content_type, body) {
  this.writeHead(http_code, {'Content-Type': content_type});
  this.writeEnd(body);
};
http.ServerResponse.prototype.json = function(obj) {
  this.writeAll(200, 'application/json', JSON.stringify(obj));
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
