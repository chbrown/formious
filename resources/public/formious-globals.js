/*jslint browser: true */ /*globals $ */
var formious = {};
formious.add = function(response) {
  return $.ajax({
    method: 'POST',
    url: window.location,
    contentType: 'application/json',
    data: JSON.stringify(response),
  });
};
formious.advance = function(response) {
  var jqXHR = formious.add(response).always(function() {
    // the server will respond to the header "x-requested-with': XMLHttpRequest"
    // by responding with the status code 200, so that the browser does
    // not gloss over the redirect.
    var redirect = jqXHR.getResponseHeader('location');
    if (redirect) {
      window.location = redirect;
    }
    else {
      var message = jqXHR.responseText;
      alert('Error: please inform the administrator that the experiment server is down. ' + message);
    }
  });
};
