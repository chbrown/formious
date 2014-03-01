<main ng-controller="adminAdministratorEditor">
  <h2>Administrator</h2>

  <section class="fill">
    <form method="PATCH" action="/admin/administrators/{{administrator.id}}" class="vform">
      <label><span>Email</span>
        <input type="text" ng-model="administrator.email" />
      </label>

      <label><span>Password (leave blank to leave unchanged)</span>
        <input type="password" />
      </label>

      <label><span>Created</span>
        {{administrator.created}}
      </label>

      <div><button>Save</button></div>
    </form>
  </section>
</main>
<script>
var administrator = <%& JSON.stringify(experiment) %>;
</script>
