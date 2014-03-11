<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <title>Experimental Interface</title>
  <script src="/static/lib/jquery.min.js"></script>
  <script>
    var human = {};
    human.add = function(response) {
      return $.ajax({
        method: 'POST',
        url: window.location,
        contentType: 'application/json',
        data: JSON.stringify(response),
      });
    };
    human.advance = function(response) {
      var jqXHR = human.add(response).always(function() {
        // the server will respond to the header "x-requested-with': XMLHttpRequest"
        // by responding with the status code 300, so that the browser does
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

    human.context = <%& serialize(context) %>;
  </script>
</head>
<body>
  <%& header %>
  <%& html %>
</body>

