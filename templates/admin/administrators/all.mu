<main ng-controller="adminTableCtrl">
  <h3>Administrators</h3>

  <section>
    <table class="striped lined padded">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Created</th>
          <th>Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="administrator in table">
          <td>{{administrator.id}}</td>
          <td><a href="/admin/administrators/{{administrator.id}}">{{administrator.email}}</a></td>
          <td><time>{{administrator.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <ajaxform method="DELETE" action="/admin/administrators/{{administrator.id}}">
              <button>Delete</button>
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
