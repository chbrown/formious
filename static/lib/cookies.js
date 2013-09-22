//"use strict"; /*jslint indent: 2 */
/** Copyright 2012-2013, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/cookies.js

*/
var cookies = (function() {
  function extend(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  var epoch = new Date(0);
  var default_cookie = {};

  function getOptions(opts) {
    // if it's a function, call it.
    var defaults = default_cookie.call ? default_cookie() : default_cookie;
    // opts override defaults, but defaults cannot be changed
    return extend(extend({}, defaults), opts);
  }

  return {
    setDefault: function(new_default_cookie) {
      default_cookie = new_default_cookie;
    },
    get: function(name, opts) {
      if (name === undefined) return this.all(opts);

      var document_cookie = document.cookie;
      var cookies = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : [];
      for (var i = 0, cookie; (cookie = cookies[i]); i++) {
        // Does this cookie string begin with the name we want?
        if (cookie.slice(0, name.length + 1) == (name + '=')) {
          var raw = cookie.slice(name.length + 1);
          return opts.raw ? raw : decodeURIComponent(raw);
        }
      }
    },
    set: function(name, value, opts) {
      opts = getOptions(opts);

      var encode = opts.raw ? function(s) { return s; } : encodeURIComponent;

      var pairs = [[encode(name), encode(value.toString())]];
      if (opts.expires) pairs.push(['expires', opts.expires.toUTCString ? opts.expires.toUTCString() : opts.expires]);
      if (opts.path) pairs.push(['path', opts.path]);
      if (opts.domain) pairs.push(['domain', opts.domain]);
      if (opts.secure) pairs.push(['secure']);
      var cookie = pairs.map(function(pair) { return pair.join('='); }).join('; ');
      document.cookie = cookie;
      return cookie;
    },
    del: function(name, opts) {
      opts = getOptions(opts);

      this.set(name, '', {expires: epoch});
    },
    all: function(opts) {
      opts = getOptions(opts);

      var cookies = {};
      var document_cookie = document.cookie;
      var cookies_list = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : [];
      var cookies_length = cookies_list.length;
      for (var i = 0; i < cookies_length; i++) {
        var cookie = cookies_list[i];
        var cookie_parts = cookie.split('=');
        var cookie_value = cookie_parts.slice(1).join('=');
        cookies[cookie_parts[0]] = opts.raw ? cookie_value : decodeURIComponent(cookie_value);
      }
      return cookies;
    }
  };
})();
