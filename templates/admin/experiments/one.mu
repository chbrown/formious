<div id="preview" style="display: none">
  <div class="controls"><span>&times;</span>Hide preview</div>
  <div class="content"></div>
</div>

<main ng-controller="adminExperimentEditor">
  <h4>{{experiment.name}}</h4>
  <!-- URL: <a href="/stimlists/ stimlist._id "> stimlist._id </a> -->
  <div class="help">
    <p>An experiment is a list of stimuli that will be presented to the participant in sequence.</p>
    <p>Each item in the experiment is known as a "stim", and can be pretty much anything, like a consent form, instructions, or adaptive classification task.</p>
  </div>

  <!-- <div ng-repeat="administrator in administrators">{{administrator}}</div> -->

  <section class="fill">
    <form class="vform" ng-submit="syncExperiment(experiment)">
      <label><span>Experiment name</span>
        <input type="text" ng-model="experiment.name" />
      </label>

      <label><span>Owner</span>
        <select ng-model="experiment.administrator_id"
          ng-options="administrator.id as administrator.email for administrator in administrators"></select>
      </label>

      <label><span>Parameters</span>
        <input type="text" ng-model="experiment.parameters" ng-list />
      </label>

      <div><button>Save</button></div>
    </form>
  </section>

  <section class="fill">
    <form class="vform">
      <label><span>Upload stims</span>
        <input type="file" id="upload" />
      </label>
    </form>
  </section>

  <section class="fill">
    <table>
      <thead>
        <tr>
          <th>Template</th>
          <th>Context</th>
          <th>Order</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="stim in experiment.stims">
          <td>{{stim.template_id}}</td>
          <td>{{stim.context}}</td>
          <td>{{stim.view_order}}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <select ng-model="new_stim.template_id"
              ng-options="template.id as template.name for template in templates"></select>
          </td>
          <td><input ng-model="new_stim.context" /></td>
          <td><input ng-model="new_stim.view_order" type="number" /></td>
          <td><button ng-click="syncStim(new_stim)">Add</button></td>
        </tr>
      </tfoot>
    </table>
  </section>
</main>
<script>
var experiment = <%& JSON.stringify(experiment) %>;
</script>
