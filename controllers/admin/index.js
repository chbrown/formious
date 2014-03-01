/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var querystring = require('querystring');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');

// router & controllers requiring authentication
var auth_R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});
auth_R.any(/^\/admin\/aws/, require('./aws'));
auth_R.any(/^\/admin\/experiments/, require('./experiments'));
auth_R.any(/^\/admin\/templates/, require('./templates'));
auth_R.any(/^\/admin\/administrators/, require('./administrators'));
auth_R.any(/^\/admin\/participants/, require('./participants'));
// GET /admin -> redirect to /admin/experiments
auth_R.any(/\/admin\/?$/, function(req, res, m) {
  res.redirect('/admin/experiments');
});
/** POST /admin/logout
Purge ticket cookie, and redirect */
auth_R.post(/^\/admin\/logout/, function(req, res) {
  logger.debug('Deleting ticket cookie "%s"', req.cookies.get('ticket'));

  req.cookies.del('ticket');
  res.redirect('/admin');
});

// router & actions for logging in
var public_R = new Router(function(req, res) {
  res.redirect('/admin/login');
});

var renderLogin = function(email, password, message, res) {
  // helper, since we serve the login page from GET as well as failed login POSTs
  var ctx = {
    email: email,
    password: password,
    message: message,
  };
  res.writeHead(401); // HTTP 401 Unauthorized
  amulet.stream(['layout.mu', 'admin/login.mu'], ctx).pipe(res);
};

/** GET /admin/login
show login page for this user */
public_R.get(/^\/admin\/login\/?$/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  renderLogin(urlObj.query.email, urlObj.query.password, 'Please login', res);
});
/** POST /admin/login
register unclaimed (no set password) user by adding password,
or login as claimed user by providing password */
public_R.post(/^\/admin\/login$/, function(req, res) {
  req.readToEnd('utf8', function(err, body) {
    if (err) return res.die('HTTP POST error', err);

    var fields = querystring.parse(body);

    // artificially slow to deflect brute force attacks
    setTimeout(function() {
      models.Administrator.authenticate(fields.email, fields.password, function(err, ticket) {
        if (err) {
          return renderLogin(fields.email, fields.password, err.toString(), res);
        }

        logger.info('Authenticated successfully. Ticket = %s', ticket);
        req.cookies.set('ticket', ticket);
        res.redirect('/admin');
      });
    }, 500);
  });
});

module.exports = function(req, res) {
  // handle auth and forward. this is the checkpoint for all admin-level
  // requests, and should send all non administrators to the login page.
  // logger.info('admin.index.routing', req.url);
  var ticket = req.cookies.get('ticket');
  models.Administrator.fromTicket(ticket, function(err, administrator) {
    if (err) {
      logger.error('Administrator not authenticated:', err);
      public_R.route(req, res);
    }
    else {
      // alright, they're in. go wild.
      // attach administrator object to the request payload
      req.administrator = administrator;
      req.ctx = {current_user: administrator};
      auth_R.route(req, res);
    }
  });
};
