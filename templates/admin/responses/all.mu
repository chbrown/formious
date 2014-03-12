<main ng-controller="adminResponsesCtrl">
  <h3>Experiment: <% experiment.name %></h3>

  <table class="striped grid padded responses" style="margin-top: 10px">
    <thead>
      <tr>
        <td>response_id</td>
        <td>participant_id</td>
        <td>participant_name</td>
        <td>experiment_id</td>
        <td>stim_id</td>
        <td ng-repeat="key in context_keys" class="context">
          {{key}}
        </td>
        <td ng-repeat="key in value_keys" class="value">
          {{key}}
        </td>
        <td>created</td>
      </tr>
    </thead>
    <tbody>
      <tr ng-repeat="response in responses">
        <td>{{response.id}}</td>
        <td>{{response.participant_id}}</td>
        <td>{{response.name || response.aws_worker_id}}</td>
        <td>{{response.experiment_id}}</td>
        <td>{{response.stim_id}}</td>
        <td ng-repeat="key in context_keys" class="context">
          {{response.context[key]}}
        </td>
        <td ng-repeat="key in value_keys" class="value">
          {{response.value[key]}}
        </td>
        <td><time ng-model="response.created"></time></td>
      </tr>
    </tbody>
  </table>
</main>

<script>
var responses = <%& serialize(responses) %>;
</script>
