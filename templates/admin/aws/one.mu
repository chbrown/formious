<main ng-controller="adminAWSAccountEditor">
  <h3>AWS Account: {{aws_account.name}}</h3>

  <section class="fill">
    <form class="vform" ng-submit="syncAWSAccount(aws_account)">
      <label><span>Name</span>
        <input type="text" ng-model="aws_account.name" />
      </label>

      <label><span>Access Key ID</span>
        <input type="text" ng-model="aws_account.access_key_id" />
      </label>

      <label><span>Secret Access Key</span>
        <input type="text" ng-model="aws_account.secret_access_key" style="width: 500px" />
      </label>

      <label><span>Created</span>
        {{aws_account.created}}
      </label>

      <div><button>Save</button></div>
    </form>
  </section>

  <h3>Mechanical Turk Hosts</h3>
  <section class="fill">
    <table>
      <thead>
        <tr>
          <th>Host</th>
          <th>Account Balance</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="host in aws_account.hosts">
          <td>{{host.name}}</td>
          <td>{{host.account_balance}}</td>
          <td><a href="/admin/aws/{{aws_account.id}}/hosts/{{host.name}}/HITs">View HITs</a></td>
          <td><a href="/admin/aws/{{aws_account.id}}/hosts/{{host.name}}/HITs/new">Create new HIT</a></td>
        </tr>
      </tbody>
    </table>
  </section>

</main>
<script>
var aws_account = <%& JSON.stringify(aws_account) %>;
</script>
