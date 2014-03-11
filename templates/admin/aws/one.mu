<main ng-controller="adminAWSAccountEditor">
  <h3>AWS Account: {{aws_account.name}}</h3>

  <section class="box">
    <form ng-submit="sync($event)">
      <label>
        <div><b>Name</b></div>
        <input type="text" ng-model="aws_account.name" />
      </label>

      <label>
        <div><b>Access Key ID</b></div>
        <input type="text" ng-model="aws_account.access_key_id" />
      </label>

      <label>
        <div><b>Secret Access Key</b></div>
        <input type="text" ng-model="aws_account.secret_access_key" style="width: 500px" />
      </label>

      <label>
        <div><b>Created</b></div>
        {{aws_account.created}}
      </label>

      <p>
        <button>Save</button>
      </p>
    </form>
  </section>

  <h3>Mechanical Turk Hosts</h3>
  <section class="fill">
    <table class="lined padded">
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
var aws_account = <%& serialize(aws_account) %>;
</script>
