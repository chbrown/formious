<h3 class="section">Stimlists</h3>

<section class="fill">
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th></th>
        <th></th>
        <th>Created</th>
        <th>Creator</th>
        <th># States</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#stimlists}}
        <tr class="record">
          <td title="{{_id}}">{{_id}}</td>
          <td><a href="/stimlists/{{_id}}">View</a></td>
          <td><a href="/admin/stimlists/{{_id}}/edit">Edit</a></td>
          <td>{{datefmt(created)}}</td>
          <td>{{creator}}</td>
          <td>{{states.length}}</td>
          <td><a href="/admin/stimlists/{{_id}}" data-method="delete">Delete</a></td>
        </tr>
      {{/stimlists}}
    </tbody>
  </table>
</section>

<section>
  <a href="/admin/stimlists/new">Create new...</a>
</section>
