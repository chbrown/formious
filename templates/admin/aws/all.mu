<h3 class="section">AWS Accounts</h3>

<section class="fill">
  <table>
    <thead>
      <tr>
        <th>Account</th>
        <th></th>
        <th>Access Key ID</th>
        <th>Secret Access Key</th>
        <th>Created</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#accounts}}
        <tr class="record">
          <td><a href="/admin/aws/{{_id}}">{{_id}}</a></td>
          <td><a href="/admin/aws/{{_id}}/edit">Edit</a></td>
          <td>{{accessKeyId}}</td>
          <td><div class="truncate">{{secretAccessKey}}</div></td>
          <td>{{datefmt(created)}}</td>
          <td><a href="/admin/aws/{{_id}}" data-method="delete">Delete</a></td>
        </tr>
      {{/accounts}}
    </tbody>
  </table>
</section>

<section>
  <a href="/admin/aws/new">Create new...</a>
</section>
