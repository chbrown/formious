<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Slug</th>
      <th>Created</th>
      <th>Creator</th>
      <th># States</th>
    </tr>
  </thead>
  <tbody>
    {{#stimlists}}
      <tr>
        <td>{{_id}}</td>
        <td>{{slug}}</td>
        <td class="nowrap shortdate">{{created}}</td>
        <td>{{creator}}</td>
        <td>{{states.length}}</td>
        <td><a href="/stimlists/{{slug}}">View</a></td>
        <td><a href="/admin/stimlists/{{_id}}/edit">Edit</a></td>
        <td><a href="/admin/stimlists/{{_id}}" data-method="delete">delete</a></td>
      </tr>
    {{/stimlists}}
  </tbody>
  <tfoot>
    <tr>
      <td>
        <div style="margin: 1ex 0">
          <a href="/admin/stimlists/new">Create new...</a>
        </div>
      </td>
    </tr>
  </tfoot>
</table>
