<main ng-controller="adminTableCtrl">
  <h2>Experiments</h2>

  <section class="fill">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Preview</th>
          <th>Created</th>
          <th>Owner</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="experiment in table">
          <td>{{experiment.id}}</td>
          <td><a href="/experiments/{{experiment.id}}">{{experiment.name}}</a></td>
          <td>{{experiment.created}}</td>
          <td>{{experiment.administrator_id}}</td>
          <td><a href="/admin/experiments/{{experiment.id}}">Edit</a></td>
          <td>
            <ajaxform method="DELETE" action="/admin/experiments/{{experiment.id}}">
              <button>Delete</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/experiments/new">Create new experiment</a>
</main>
<script>
var table = <%& serialize(experiments) %>;
</script>
