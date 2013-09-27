<section>
  <h3>Users</h3>
</section>

<section class="fill">
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
    <tbody>
      {{#users}}
        <tr>
          <td><a href="/admin/users/{{_id}}">{{_id}}</a></td>
          <td><a href="/admin/users/{{_id}}/edit">Edit</a></td>
          <td>{{datefmt(created)}}</td>
          <td>{{responses.length}}</td>
          <td>{{bonus_paid}}</td>
          <td>{{bonus_owed}}</td>
          <td><span class="truncate">{{password}}</span></td>
          <td>{{superuser}}</td>
          <td>{{tickets.length}}</td>
        </tr>
      {{/}}
    </tbody>
  </table>
</section>

<section>
  <a href="/admin/users/new">Create new...</a>
</section>
