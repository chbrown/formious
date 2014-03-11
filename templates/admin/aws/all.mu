<main ng-controller="adminTableCtrl">
  <h2>AWS Accounts</h2>

  <section class="fill">
    <table class="striped lined padded">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Access Key ID</th>
          <th>Secret Access Key</th>
          <th>Created</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="aws_account in table">
          <td>{{aws_account.id}}</td>
          <td><a href="/admin/aws/{{aws_account.id}}">{{aws_account.name}}</a></td>
          <td>{{aws_account.access_key_id}}</td>
          <td>{{aws_account.secret_access_key}}</td>
          <td>{{aws_account.created}}</td>
          <td>
            <ajaxform method="DELETE" action="/admin/aws/{{aws_account.id}}">
              <button>Delete</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/aws/new">Create new AWS Account</a>
</main>
<script>
var table = <%& serialize(aws_accounts) %>;
</script>
