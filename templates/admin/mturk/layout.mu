<nav fixedflow class="sub" ng-controller="adminMTurkNavCtrl">
  <select ng-model="$storage.aws_account_id"
    ng-options="aws_account.id as aws_account.name for aws_account in aws_accounts">
    <option value="">-- AWS Account --</option>
  </select>
  <select ng-model="$storage.host"
    ng-options="host.name as host.name for host in hosts">
    <option value="">-- Host --</option>
  </select>
</nav>
<%<%>
