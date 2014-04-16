<main ng-controller="adminAdministratorsCtrl">
  <h3>Administrators</h3>

  <section>
    <table class="striped lined padded">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="administrator in administrators">
          <td>{{administrator.id}}</td>
          <td><a href="/admin/administrators/{{administrator.id}}">{{administrator.email}}</a></td>
          <td><time>{{administrator.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <button ng-click="delete(administrator)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/administrators/new">Create new administrator</a>
</main>
