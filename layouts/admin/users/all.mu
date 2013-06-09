<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Created</th>
      <th># Responses</th>
      <th>Bonus paid</th>
      <th>Bonus owed</th>
      <th>Password</th>
      <th>Superuser</th>
      <th># Tickets</th>
    </tr>
  </thead>
  {{#users -> user}}
    <tr>
      <td><a href="/admin/users/{{user._id}}">{{user._id}}</td>
      <td class="nowrap" style="width: 50px; overflow: hidden; table-layout:fixed;">{{user.created}}</td>
      <td>{{user.responses.length}}</td>
      <td>{{user.bonus_paid}}</td>
      <td>{{user.bonus_owed}}</td>
      <td>{{user.password}}</td>
      <td>{{user.superuser}}</td>
      <td>{{user.tickets.length}}</td>
    </tr>
  {{/}}
</table>
