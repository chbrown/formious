<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>Formious Admin</title>
  <link rel="icon" href="/static/favicon.ico" type="image/x-icon">
  <link href="/static/site.css" rel="stylesheet" type="text/css" />
  <script src="/static/lib.min.js"></script>
  <script src="/static/lib/angular-plugins.js"></script>
  <script src="/static/local.js"></script>
  <script src="/ng/app.js"></script>
  <script src="/ng/models.js"></script>
  <script src="/ng/admin/access_tokens/controllers.js"></script>
  <script src="/ng/admin/administrators/controllers.js"></script>
  <script src="/ng/admin/aws_accounts/controllers.js"></script>
  <script src="/ng/admin/experiments/controllers.js"></script>
  <script src="/ng/admin/experiments/stims/controllers.js"></script>
  <script src="/ng/admin/mturk/HITs/controllers.js"></script>
  <script src="/ng/admin/responses/controllers.js"></script>
  <script src="/ng/admin/templates/controllers.js"></script>
</head>
<body ng-app="app" class="admin">
  <flash></flash>
  <nav fixedflow activate-current-anchor class="root">
    <div style="float: right">
      <a href="/admin/administrators/<% current_user.id %>">me</a>
      <ajaxform method="POST" action="/admin/logout" style="display: inline">
        <button class="anchor">Logout</button>
      </ajaxform>
    </div>
    <a ui-sref="aws_accounts">AWS Accounts</a>
    <a ui-sref="mturk.HITs">MTurk</a>
    <a ui-sref="administrators">Administrators</a>
    <a ui-sref="experiments">Experiments</a>
    <a ui-sref="templates">Templates</a>
  </nav>
  <ui-view></ui-view>
</body>
