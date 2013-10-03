{{#user}}
<h3 class="section">User: {{_id}}</h3>

<section class="fill">
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
</section>

<section>
  <a href="/admin/users/{{_id}}/edit">Edit user</a>
</section>
{{/user}}

<section class="fill">
  <h3>Responses</h3>
  <table>
    <thead>
      <tr>
        <th>Submitted</th>
        <th>Stimlist</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
    <tbody>
      {{#user.responses}}
        <tr>
          <td>{{datetimefmt(submitted)}}</td>
          <td>{{stimlist}}</td>
          <td style="max-width: 600px"><div class="hover-flow">{{{JSON.stringify(others)}}}</div></td>
        </tr>
      {{/}}
    </tbody>
  </table>
</section>
