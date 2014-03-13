<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>Admin</title>
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <link href="/static/site.css" rel="stylesheet" type="text/css" />
  <script src="/static/compiled.js"></script>
  <script src="/static/local.js"></script>
  <script src="/static/app.js"></script>
  <script src="/static/app.services.js"></script>
  <script src="/static/app.controllers.js"></script>
</head>
<body ng-app="app" class="admin">
  <div id="flash"></div>
  <nav fixedflow class="root">
    <div style="float: right">
      <a href="/admin/administrators/<% current_user.id %>">me</a>
      <ajaxform method="POST" action="/admin/logout"><button class="anchor">Logout</button></ajaxform>
    </div>
    <a href="/admin/aws">AWS Accounts</a>
    <a href="/admin/administrators">Administrators</a>
    <!-- <a href="/admin/participants">Participants</a> -->
    <a href="/admin/experiments">Experiments</a>
    <a href="/admin/templates">Templates</a>
  </nav>
  <%<%>
</body>
