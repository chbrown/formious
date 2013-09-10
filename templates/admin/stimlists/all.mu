<h3>Stimlists</h3>
<table>
  <thead>
    <tr>
      <th>Slug</th>
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
      <tr>
        <td title="{{_id}}">{{slug}}</td>
        <td><a href="/stimlists/{{slug}}">Play</a></td>
        <td><a href="/admin/stimlists/{{_id}}/edit">Edit</a></td>
        <td class="nowrap shortdate">{{created}}</td>
        <td>{{creator}}</td>
        <td>{{states.length}}</td>
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
