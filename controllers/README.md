## Controllers

All modules in `/controllers/**/*.js` should, for the most part, define only a single export:

```javascript
module.exports = function(req, res) {
  ...
}
```

E.g., `controllers/fancy.js` might look like this

```javascript
module.exports = function(req, res) {
  /** handle any requests for /fancy/*

  req is an http-enhanced version of the http.IncomingMessage object
  res is an http-enhanced version of the http.ServerResponse object

  Additionally:

  * req.cookies will be an instance of the Cookies helper object (get/settable)
  * req.url will be the full url ("/fancy/index", not just "/index")
  */
  ...
  res.end();
};
```

And, heck, while we're making arbitrary rules, let's say that this export should go at the bottom.
