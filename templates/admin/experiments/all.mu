<main ng-controller="adminTableCtrl">
  <h3>Experiments</h3>

  <section class="fill">
    <table class="striped lined padded">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Created</th>
          <th>Owner</th>
          <th>Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="experiment in table">
          <td>{{experiment.id}}</td>
          <td><a href="/admin/experiments/{{experiment.id}}">{{experiment.name}}</a></td>
          <td><time ng-model="experiment.created" class="date"></time></td>
          <td>{{experiment.administrator_id}}</td>
          <td>
            <a href="/experiments/{{experiment.id}}">Public</a>
            <a href="/admin/experiments/{{experiment.id}}/responses">Responses</a>
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
