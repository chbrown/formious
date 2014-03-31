<main ng-controller="adminAdministratorEditor">
  <h3>Administrator</h3>
  <section class="box">
    <!-- method="PATCH" action="/admin/administrators/{{administrator.id}}" -->
    <form>
      <label>
        <div><b>Email</b></div>
        <input type="text" ng-model="administrator.email" style="width: 200px">
      </label>

      <label>
        <div><b>Password</b> <span class="help">Leave blank to keep current password</span></b></div>
        <input type="password" ng-model="administrator.password" style="width: 200px">
      </label>

      <label>
        <div><b>Created</b></div>
        <time>{{administrator.created | date:"medium"}}</time>
      </label>

      <p>
        <button ng-click="sync($event)">Save</button>
      </p>
    </form>
  </section>

  <h3>AWS Accounts</h3>
  <section class="box">
    <table class="lined">
      <thead>
        <tr>
          <th>Name</th>
          <th>Access Key ID</th>
          <th>Priority</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="aws_account in aws_accounts">
          <td><a href="/admin/aws/{{aws_account.id}}">{{aws_account.name}}</a></td>
          <td>{{aws_account.access_key_id}}</td>
          <td>{{aws_account.priority}}</td>
          <td><time>{{aws_account.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <ajaxform method="DELETE" action="/admin/administrators/{{administrator.id}}/aws/{{aws_account.id}}">
              <button>Disown</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      <select ng-model="new_account.aws_account_id"
        ng-options="aws_account.id as aws_account.name for aws_account in AWS.all"></select>
      <input ng-model="new_account.priority" type="number">
      <button ng-click="addAWSAccount(new_account)">Add account</button>
    </p>
  </section>

</main>
<script>
var administrator = <%& serialize(administrator) %>;
var aws_accounts = <%& serialize(aws_accounts) %>;
</script>
