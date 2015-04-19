var path = require('path');
var send = require('send');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.get(/^\/(admin|$)/, function(req, res) {
  req.url = '/ui/admin.html';
  R.route(req, res);
});

// attach controllers
R.any(/^\/api/, require('./api'));
R.any(/^\/experiments/, require('./experiments'));
R.any(/^\/login/, require('./login'));
R.any(/^\/mturk/, require('./mturk'));
R.any(/^\/util/, require('./util'));

var UI_ROOT = path.join(__dirname, '..', 'ui');

R.get(/^\/ui\/([^?]+)(\?|$)/, function(req, res, m) {
  send(req, m[1], {root: UI_ROOT})
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .on('directory', function() {
      res.status(404).die('No resource at: ' + req.url);
    })
    .pipe(res);
});

module.exports = R.route.bind(R);
