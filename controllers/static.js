var path = require('path');
var send = require('send');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

var serve = function(req, res, root, path) {
  send(req, path, {root: root})
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .on('directory', function() {
      res.status(404).die('No resource at: ' + req.url);
    })
    .pipe(res);
};

R.get(/^\/static\/([^?]+)(\?|$)/, function(req, res, m) {
  var root = path.join(__dirname, '..', 'static');
  serve(req, res, root, m[1]);
});

R.get(/^\/ng\/([^?]+)(\?|$)/, function(req, res, m) {
  var root = path.join(__dirname, '..', 'ng');
  serve(req, res, root, m[1]);
});

R.get('/favicon.ico', function(req, res) {
  var root = path.join(__dirname, '..', 'static');
  serve(req, res, root, 'favicon.ico');
});

module.exports = R.route.bind(R);
