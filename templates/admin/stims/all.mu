<h3 class="section">Stim Templates</h3>

<section class="fill">
  <table>
    <thead>
      <tr>
        <th>Stim Template</th>
        <th></th>
        <th></th>
        <th>Created</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#stims}}
        <tr class="record">
          <td><a href="/admin/stims/{{_id}}">{{_id}}</a></td>
          <td><a href="/admin/stims/{{_id}}/edit">Edit</a></td>
          <td><a href="/admin/stims/{{_id}}/clone">Clone</a></td>
          <td>{{datefmt(created)}}</td>
          <td><a href="/admin/stims/{{_id}}" data-method="delete">Delete</a></td>
        </tr>
      {{/stims}}
    </tbody>
  </table>
</section>

<section>
  <a href="/admin/stims/new">Create new...</a>
</section>
