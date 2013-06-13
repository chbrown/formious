<h3>New AWS Account</h3>
<form action="/admin/mt" method="POST" class="vform">
  <label><span>Name</span> <input name="_id" /></label>
  <label><span>Access Key ID</span> <input name="accessKeyId" /></label>
  <label><span>Secret Access Key</span> <input name="secretAccessKey" /></label>
  <button>Create AWS Account</button>
</form>

<hr />

<h3>AWS Accounts</h3>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Access Key ID</th>
      <th>Secret Access Key</th>
      <th>Created</th>
      <th></th>
    </tr>
  </thead>
  {{#accounts}}
    <tr>
      <td><a href="/admin/mt/{{_id}}">{{_id}}</a></td>
      <td>{{accessKeyId}}</td>
      <td>{{secretAccessKey}}</td>
      <td>{{created}}</td>
      <td><a href="/admin/mt/{{_id}}" data-method="delete">delete</a></td>
    </tr>
  {{/accounts}}
</table>
