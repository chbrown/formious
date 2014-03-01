/*jslint node: true */
var http = require('http-enhanced');
var url = require('url');
var querystring = require('querystring');
var logger = require('loge');
var amulet = require('amulet');

// a little layer on top of http-enhanced
http.IncomingMessage.prototype.readJSON = function(callback) {
  /** Really, might as well use readData

  callback signature: function(err, Object) */
  this.readToEnd(function(err, body) {
    if (err) return callback(err);

    try {
      var data = JSON.parse(body);
      callback(null, data);
    }
    catch (exc) {
      callback(exc);
    }
  });
};
http.IncomingMessage.prototype.readForm = function(callback) {
  /** Really, might as well use readData

  callback signature: function(err, Object) */
  this.readToEnd(function(err, body) {
    if (err) return callback(err);

    try {
      // will querystring.parse ever throw?
      var data = querystring.parse(body);
      callback(null, data);
    }
    catch (exc) {
      callback(exc);
    }
  });
};
http.IncomingMessage.prototype.readData = function(callback) {
  // callback signature: function(err, Object)
  var self = this;
  this.readToEnd(function(err, body) {
    if (err) return callback(err);

    try {
      var content_type = self.headers['content-type'];
      var data = null;
      if (content_type.match(/application\/json/)) {
        data = JSON.parse(body);
      }
      else if (content_type.match(/application\/x-www-form-urlencoded/)) {
        // will querystring.parse ever throw?
        data = querystring.parse(body);
      }
      else if (self.method == 'GET') {
        data = url.parse(self.url, true).query;
      }
      callback(null, data);
    }
    catch (exc) {
      callback(exc);
    }
  });
};

http.ServerResponse.prototype.adapt = function(req, ctx, templates) {
  // try to flexibly determine the desired content type
  var content_type = 'html';
  if (req.headers.accept.match(/application\/json/)) {
    content_type = 'json';
  }
  else if (req.url.match(/.json$/)) {
    content_type = 'json';
  }

  // okay, now adapt and respond accordingly
  if (content_type == 'json') {
    this.json(ctx);
  }
  else { // assume html
    amulet.stream(templates, req.ctx).pipe(this);
  }
};

module.exports = http;
