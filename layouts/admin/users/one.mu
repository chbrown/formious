<h3>User: {{user._id}}</h3>
<table>
  <tr>
    <td style="width: 100px">Worker ID</td>
    <td>{{user._id}}</td>
  </tr>
  <tr><td>Created</td><td>{{user.created}}</td></tr>
  <tr><td>Seen</td><td>{{user.seen}}</td></tr>
  <tr><td>Number of Responses</td><td>{{user.responses.length}}</td></tr>
  <tr><td>Bonus paid</td><td>{{user.bonus_paid}}</td></tr>
  <tr><td>Bonus owed</td><td>{{user.bonus_owed}}</td></tr>
  <tr><td>Password</td><td>{{user.password}}</td></tr>
  <tr><td>Superuser</td><td>{{user.superuser}}</td></tr>
  <tr><td>Tickets</td><td>{{user.tickets}}</td></tr>
</table>
