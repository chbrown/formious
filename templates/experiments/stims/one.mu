<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <title>Experimental Interface</title>
  <script src="/static/lib/jquery.min.js"></script>
  <script src="/static/lib/underscore.min.js"></script>
  <script src="/static/human.js"></script>
  <script>human.context = <%& JSON.stringify(context) %>;</script>
</head>
<body>
  <%& html %>
</body>

