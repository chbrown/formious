<table>
  <thead>
    <tr>
      <th>ID</th>
      <th></th>
      <th>Created</th>
      <th># Responses</th>
      <th>Bonus paid</th>
      <th>Bonus owed</th>
      <th>Password</th>
      <th>Superuser</th>
      <th># Tickets</th>
    </tr>
  </thead>
  {{#users}}
    <tr>
      <td><a href="/admin/users/{{_id}}">{{_id}}</td>
      <td><a href="/admin/users/{{_id}}/edit">Edit</td>
      <td class="nowrap shortdate">{{created}}</td>
      <td>{{responses.length}}</td>
      <td>{{bonus_paid}}</td>
      <td>{{bonus_owed}}</td>
      <td>{{password}}</td>
      <td>{{superuser}}</td>
      <td>{{tickets.length}}</td>
    </tr>
  {{/}}
</table>
