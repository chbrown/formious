<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>Turkserv Admin</title>
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <link href="/static/site.css" rel="stylesheet" type="text/css" />
  <script src="/static/compiled.js"></script>
  <script src="/static/templates.js"></script>
  <script src="/static/local.js"></script>
  <script>
  var started = new Date();
  //DEBUG=true;
  </script>
</head>
<body class="admin">
  <nav>
    <a href="/admin/aws">AWS Accounts</a>
    <a href="/admin/users">Users</a>
    <a href="/admin/stimlists">Stimlists</a>
    <a href="/users/{{ticket_user._id}}/logout" style="float: right">Logout</a>
  </nav>
  <div class="content">
    {{<}}
  </div>
</body>
