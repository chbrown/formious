<main ng-controller="adminTableCtrl">
  <h2>Experiment: <% experiment.name %></h2>

  <section class="fill">
    <table>
      <thead>
        <tr>
          <th>response_id</th>
          <th>participant_id</th>
          <th>experiment_id</th>
          <th>stim_id</th>
          <th>context</th>
          <th>value</th>
          <th>created</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="experiment in table">
          <td>{{experiment.id}}</td>
          <td>{{experiment.participant_id}}</td>
          <td>{{experiment.experiment_id}}</td>
          <td>{{experiment.stim_id}}</td>
          <td>{{experiment.context}}</td>
          <td>{{experiment.value}}</td>
          <td><time ng-model="experiment.created"></time></td>
        </tr>
      </tbody>
    </table>
  </section>
</main>
<script>
var table = <%& serialize(responses) %>;
</script>
