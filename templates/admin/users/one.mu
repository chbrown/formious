{{#user}}
  <h3>User: {{_id}}</h3>
  <table>
    <tr>
      <td style="width: 100px">Worker ID</td>
      <td>{{_id}}</td>
    </tr>
    <tr><td>Created</td><td>{{created}}</td></tr>
    <tr><td>Seen</td><td>{{seen}}</td></tr>
    <tr><td>Number of Responses</td><td>{{responses.length}}</td></tr>
    <tr><td>Bonus paid</td><td>{{bonus_paid}}</td></tr>
    <tr><td>Bonus owed</td><td>{{bonus_owed}}</td></tr>
    <tr><td>Password</td><td>{{password}}</td></tr>
    <tr><td>Superuser</td><td>{{superuser}}</td></tr>
    <tr>
      <td>Tickets</td>
      <td>
        {{#tickets}}
          <div>{{.}}</div>
        {{/tickets}}
      </td>
    </tr>
  </table>
{{/user}}
