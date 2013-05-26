/*!
 * jQuery/Zepto Cookie Plugin
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * Some modifications by Christopher Brown <io@henrian.com>
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
// (function($) {})($);
function _getOptions(options) {
  var defaults = $.defaultCookie;
  if ($.defaultCookie.call)
    defaults = $.defaultCookie();
  return $.extend({}, defaults, options);
}
// $.defaultCookie = $.defaultCookie || null;
$.setCookie = function(name, value, options) {
  options = _getOptions(options);

  var encode = options.raw ? function(s) { return s; } : encodeURIComponent;
  // if (value === null || value === undefined) { options.expires = -1; }

  var pairs = [[encode(name), encode(value.toString())]];
  if (options.expires) pairs.push(['expires', options.expires.toUTCString()]);
  if (options.path) pairs.push(['path', options.path]);
  if (options.domain) pairs.push(['domain', options.domain]);
  if (options.path) pairs.push(['secure']);
  var cookie = pairs.map(function(pair) { return pair.join('='); }).join('; ');
  document.cookie = cookie;
  return cookie;
};
$.getCookie = function(name, options) {
  options = _getOptions(options);

  var document_cookie = document.cookie;
  var cookies = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : [];
  for (var i = 0, cookie; (cookie = cookies[i]); i++) {
    // Does this cookie string begin with the name we want?
    if (cookie.slice(0, name.length + 1) == (name + '=')) {
      var raw = cookie.slice(name.length + 1);
      return options.raw ? raw : decodeURIComponent(raw);
    }
  }
};
