<main ng-controller="adminAdministratorEditor">
  <h3>Administrator</h3>

  <section class="box">
    <!-- method="PATCH" action="/admin/administrators/{{administrator.id}}" -->
    <form>
      <label>
        <div><b>Email</b></div>
        <input type="text" ng-model="administrator.email" style="width: 200px">
      </label>

      <label>
        <div><b>Password (blank to leave unchanged)</b></div>
        <input type="password" ng-model="administrator.password" style="width: 200px">
      </label>

      <label>
        <div><b>Created</b></div>
        <time ng-model="administrator.created" class="datetime"></time>
      </label>

      <p>
        <button ng-click="sync($event)">Save</button>
      </p>
    </form>
  </section>
</main>
<script>
var administrator = <%& serialize(administrator) %>;
</script>
