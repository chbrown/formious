var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

// attach controllers
R.any(/^\/(static|ng|favicon\.ico)/, require('./static'));
R.any(/^\/experiments/, require('./experiments'));
R.any(/^\/admin/, require('./admin'));
R.any(/^\/api/, require('./api'));
R.any(/^\/login/, require('./login'));
R.any(/^\/mturk/, require('./mturk'));
R.any(/^\/util/, require('./util'));

module.exports = R.route.bind(R);
