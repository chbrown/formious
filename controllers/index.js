/*jslint node: true */
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// attach controllers
R.any(/^\/(templates|static|favicon\.ico)/, require('./static'));
R.any(/^\/experiments/, require('./experiments'));
R.any(/^\/admin/, require('./admin'));
R.any(/^\/api/, require('./api'));

module.exports = R.route.bind(R);
