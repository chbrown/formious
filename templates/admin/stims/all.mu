<h3 class="section">Stim Templates</h3>

<section class="fill">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th></th>
        <th>Created</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#stims}}
        <tr>
          <td title="{{_id}}">{{name}}</td>
          <td><a href="/admin/stims/{{_id}}/edit">Edit</a></td>
          <td>{{datefmt(created)}}</td>
          <td><a href="/admin/stims/{{_id}}" data-method="delete">delete</a></td>
        </tr>
      {{/stims}}
    </tbody>
  </table>
</section>

<a href="/admin/stims/new" class="section">Create new...</a>
