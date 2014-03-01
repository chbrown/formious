<main ng-controller="adminExperimentEditor">

  <h4>{{experiment.name}}</h4>
  <!-- URL: <a href="/stimlists/ stimlist._id "> stimlist._id </a> -->
  <div class="help">
    <p>An experiment is a list of stimuli that will be presented to the participant in sequence.</p>
    <p>Each item in the experiment is known as a "stim", and can be pretty much anything, like a consent form, instructions, or adaptive classification task.</p>
  </div>

  <!-- <div ng-repeat="administrator in administrators">{{administrator}}</div> -->

  <section class="fill">
    <form class="vform" ng-submit="sync($event, angular.noop)">
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
    <table class="striped">
      <thead>
        <tr>
          <th></th>
          <th>Template</th>
          <th>Context</th>
          <!-- <th ng-repeat="parameter in experiment.parameters">{{parameter}}</th> -->
          <th>Order</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="stim in experiment.stims">
          <td>{{stim.id}}</td>
          <td>
            <select ng-model="stim.template_id"
              ng-options="template.id as template.name for template in templates"></select>
          </td>
          <!-- <td ng-repeat="parameter in experiment.parameters">
            <input ng-model="stim.context[parameter]" />
          </td> -->
          <td>
            <textarea json-transform ng-model="stim.context" class="json"></textarea>
          </td>
          <td>
            <input ng-model="stim.view_order" type="number" style="width: 50px" />
          </td>
          <td>
            <!-- <button ng-click="previewStim(stim)">Preview</button> -->
            <a href="/experiments/{{experiment.id}}/stims/{{stim.id}}">Preview</a>
          </td>
          <td>
            <button ng-click="syncStim(stim, $event)">Save</button>
          </td>
          <td>
            <ajaxform method="DELETE" action="/admin/experiments/{{experiment.id}}/stims/{{stim.id}}">
              <button>Delete</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>New</td>
          <td>
            <select ng-model="new_stim.template_id"
              ng-options="template.id as template.name for template in templates"></select>
          </td>
          <td>
            <textarea json-transform ng-model="new_stim.context" class="json"></textarea>
          </td>
          <td>
            <input ng-model="new_stim.view_order" type="number" style="width: 50px" />
          </td>
          <td></td>
          <td></td>
          <td>
            <button ng-click="syncStim(new_stim, $event)">Add</button>
          </td>
        </tr>
      </tfoot>
    </table>
  </section>

  <div class="preview" ng-show="show_preview">
    <div class="controls"><span>&times;</span>Hide preview</div>
    <div class="content">
      <iframe></iframe>
    </div>
  </div>

</main>
<script>
var experiment = <%& JSON.stringify(experiment) %>;
</script>
