<h3>AWS Accounts</h3>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th></th>
      <th></th>
      <th>Access Key ID</th>
      <th>Secret Access Key</th>
      <th>Created</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {{#accounts}}
      <tr>
        <td title="{{_id}}">{{name}}</td>
        <td><a href="/admin/aws/{{_id}}">View</a></td>
        <td><a href="/admin/aws/{{_id}}/edit">Edit</a></td>
        <td>{{accessKeyId}}</td>
        <td>{{secretAccessKey}}</td>
        <td>{{created}}</td>
        <td><a href="/admin/aws/{{_id}}" data-method="delete">delete</a></td>
      </tr>
    {{/accounts}}
  </tbody>
  <tfoot>
    <tr>
      <td>
        <div style="margin: 1ex 0">
          <a href="/admin/aws/new">Create new...</a>
        </div>
      </td>
    </tr>
  </tfoot>
</table>
