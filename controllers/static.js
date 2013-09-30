'use strict'; /*jslint es5: true, node: true, indent: 2 */
var path = require('path');
var send = require('send');
var Router = require('regex-router');

var logger = require('../lib/logger');
var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// only search up the querystring or the end of the url, in case we avert caching with ?t=[whatever]

R.get(/^\/static\/([^?]+)(\?|$)/, function(req, res, m) {
  // logger.debug('send /static: %s', m[1]);
  send(req, m[1])
    .root(path.join(__dirname, '..', 'static'))
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .on('directory', function() {
      res.die(404, 'No resource at: ' + req.url);
    })
    .pipe(res);
});

// this is a little weird, for now
R.get(/^\/templates\/stims\/([^?]+\.bars)(\?|$)/, function(req, res, m) {
  // only handles .bars, at the moment
  logger.debug('/templates/stims: %s', m[1]);
  // check if there is a StimTemplate, first
  var name = m[1].replace(/\.bars$/, '');
  models.StimTemplate.findOne({name: name}, function(err, stim_template) {
    if (err) return res.die('StimTemplate.findOne error' + err);

    if (stim_template) {
      logger.debug('found StimTemplate:', stim_template.name);

      res.writeAll(200, 'text/x-handlebars-template', stim_template.html);
    }
    else {
      // else we hope that there's a static file
      logger.debug('send: %s', m[1]);
      res.setHeader('Content-Type', 'text/x-handlebars-template');
      send(req, m[1])
        .root(path.join(__dirname, '..', 'templates', 'stims'))
        // .on('file', function(path, stat) {})
        .on('error', function(err) { res.die(err.status || 500, 'send error: ' + err.message); })
        .on('directory', function() { res.die(404, 'No resource at: ' + req.url); })
        .pipe(res);
    }
  });
});

R.get(/^\/templates\/([^?]+)(\?|$)/, function(req, res, m) {
  logger.debug('send /templates: %s', m[1]);
  send(req, m[1])
    .root(path.join(__dirname, '..', 'templates'))
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .on('directory', function() {
      res.die(404, 'No resource at: ' + req.url);
    })
    .pipe(res);
});

R.get('/favicon.ico', function(req, res) {
  send(req, 'favicon.ico')
    .root(path.join(__dirname, '..', 'static'))
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .pipe(res);
});

module.exports = R.route.bind(R);
