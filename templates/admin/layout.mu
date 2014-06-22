<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>Admin</title>
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <link href="/static/site.css" rel="stylesheet" type="text/css" />
  <script src="/static/lib.max.js"></script>
  <script src="/static/lib/angular-plugins.js"></script>
  <script src="/static/local.js"></script>
  <script src="/static/app/module.js"></script>
  <script src="/static/app/controllers/index.js"></script>
  <script src="/static/app/controllers/administrators.js"></script>
  <script src="/static/app/controllers/aws_accounts.js"></script>
  <script src="/static/app/controllers/experiments.js"></script>
  <script src="/static/app/controllers/templates.js"></script>
  <script src="/static/app/controllers/mturk/HITs.js"></script>
  <script src="/static/app/models.js"></script>
  <script src="/static/app/config.js"></script>
</head>
<body ng-app="app" class="admin">
  <flash></flash>
  <nav fixedflow class="root">
    <div style="float: right">
      <a href="/admin/administrators/<% current_user.id %>">me</a>
      <ajaxform method="POST" action="/admin/logout" style="display: inline">
        <button class="anchor">Logout</button>
      </ajaxform>
    </div>
    <a href="/admin/aws_accounts">AWS Accounts</a>
    <a href="/admin/mturk/HITs">MTurk</a>
    <a href="/admin/administrators">Administrators</a>
    <!-- <a href="/admin/participants">Participants</a> -->
    <a href="/admin/experiments">Experiments</a>
    <a href="/admin/templates">Templates</a>
  </nav>
  <ui-view></ui-view>
</body>
