<main ng-controller="adminTableCtrl">
  <h2>Templates</h2>

  <section class="fill">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>HTML</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="template in table">
          <td>{{template.id}}</td>
          <td><a href="/admin/templates/{{template.id}}">{{template.name}}</a></td>
          <!-- <td><a href="/admin/templates/{{template.id}}/clone">Clone</a></td> -->
          <td>{{template.html.slice(0, 100)}}</td>
          <td>{{template.created}}</td>
          <td>
            <ajaxform method="DELETE" action="/admin/templates/{{template.id}}">
              <button>Delete</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/templates/new">Create new template</a>
</main>
<script>
var table = <%& templates_json %>;
</script>
