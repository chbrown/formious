<main ng-controller="adminTemplatesCtrl">
  <h3>Templates</h3>

  <section>
    <table class="striped lined padded fill">
      <thead>
        <tr>
          <th>Name</th>
          <th>HTML</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="template in templates">
          <td title="{{template.id}}">
            <a href="/admin/templates/{{template.id}}">{{template.name}}</a>
          </td>
          <td><code>{{template.html.slice(0, 100)}}</code></td>
          <td><time>{{template.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <button ng-click="delete(template)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/templates/new">Create new template</a>
</main>
