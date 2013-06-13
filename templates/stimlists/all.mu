<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Created</th>
      <th>Creator</th>
      <th>Slug</th>
      <th>CSV.length</th>
      <th># States</th>
    </tr>
  </thead>
  <tbody>
    {{#stimlists}}
      <tr>
        <td><a href="/stimlists/{{_id}}/edit">{{_id}}</a></td>
        <td class="nowrap shortdate">{{created}}</td>
        <td>{{creator}}</td>
        <td><a href="/stimlists/{{slug}}/edit">{{slug}}</a></td>
        <td>{{bonus_owed}}</td>
        <td>{{password}}</td>
        <td>{{superuser}}</td>
        <td>{{tickets.length}}</td>
      </tr>
    {{/stimlists}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="8"><a href="/stimlists/new">Create new...</a></td>
    </tr>
  </tfoot>
</table>
