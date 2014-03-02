<main ng-controller="adminTableCtrl">
  <h2>Administrators</h2>

  <section class="fill">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Created</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="administrator in table">
          <td>{{administrator.id}}</td>
          <td>{{administrator.email}}</td>
          <td>{{administrator.created}}</td>
          <td><a href="/admin/administrators/{{administrator.id}}">Edit</a></td>
          <td>
            <ajaxform method="DELETE" action="/admin/administrators/{{administrator.id}}">
              Delete
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/administrators/new">Create new administrator</a>
</main>
<script>
var table = <%& serialize(administrators) %>;
</script>
