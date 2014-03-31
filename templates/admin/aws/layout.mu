  <select ng-model="$storage.aws_account_id"
    ng-options="aws_account.id as aws_account.name for aws_account in AWS.accounts">
    <option value="">-- AWS Account --</option>
  </select>
  <select ng-model="$storage.aws_host"
    ng-options="host.name as host.name for host in AWS.hosts">
    <option value="">-- Host --</option>
  </select>
