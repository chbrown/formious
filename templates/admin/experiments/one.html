<div ng-controller="adminExperimentCtrl">
  <nav fixedflow class="sub">
    <div style="float: right">
      <a href="/admin/mturk/HITs/new?Title={{experiment.name}}&ExternalURL={{site_url}}experiments/{{experiment.id}}">Prepare HIT</a>

      <a href="/experiments/{{experiment.id}}">Public</a>
      <a href="#" ng-click="responses($event)">Responses</a>
    </div>

    <span>Experiment: <b>{{experiment.name}}</b></span>
    <button ng-click="sync($event)">Save</button>
  </nav>

  <main>
    <div class="help">
      <p>An experiment is a list of stimuli that will be presented to the participant in sequence.</p>
      <p>Each item in the experiment is known as a "stim", and can be pretty much anything, like a consent form, instructions, or adaptive classification task.</p>
    </div>

    <section class="box">
      <form ng-submit="sync($event)">
        <label>
          <div><b>Experiment name</b></div>
          <input type="text" ng-model="experiment.name" style="width: 200px">
        </label>

        <label>
          <div><b>Owner</b></div>
          <select ng-model="experiment.administrator_id"
            ng-options="administrator.id as administrator.email for administrator in administrators"></select>
        </label>

        <div>
          <label style="float: right">
            <input type="checkbox" ng-model="$storage.expand_experiment_html"><span>Expand</span>
          </label>
          <label>
            <div><b>Header html</b>
              <span class="help">
                <p>This will be inserted at the top of every page in the experiment, right after the &lt;body&gt; tag. You might put things like inline styles, &lt;script&gt; imports, etc., to give your experiment a unified look or to avoid having to includes those in multiple templates.</p>
              </span>
            </div>
            <textarea ng-model="experiment.html" enhance ng-keydown="keydown($event)"
              ng-class="{unlimited: $storage.expand_experiment_html}"
              class="code" style="min-height: 40px; max-height: 100px; width: 100%;"></textarea>
          </label>
        </div>

        <label>
          <div><b>Parameters</b></div>
          <input type="text" ng-model="experiment.parameters" ng-list style="width: 100%">
        </label>

        <p><button>Save</button></p>
      </form>
    </section>

    <section class="box">
      <form class="vform">
        <label><span>Upload stims</span>
          <input type="file" id="upload" />
        </label>
      </form>
    </section>

    <table class="striped grid padded fill">
      <thead>
        <tr>
          <td></td>
          <td>template</td>
          <td ng-repeat="parameter in experiment.parameters">
            {{parameter}}
          </td>
          <td>order</td>
          <td></td>
        </tr>
      </thead>
      <tbody checkbox-sequence>
        <tr ng-repeat="stim in stims" ng-class="{selected: stim.selected}">
          <td style="padding-right: 5px"><input type="checkbox" ng-model="stim.selected"></td>
          <td class="nowrap">
            <!-- <select ng-model="stim.template_id"
              ng-options="template.id as template.name for template in templates"></select> -->

            <a href="/admin/templates/{{stim.template_id}}">
              {{templates | valueWhere:{id: stim.template_id}:'name'}}
            </a>
          </td>
          <!-- <td ng-repeat="parameter in experiment.parameters">
            <input ng-model="stim.context[parameter]" />
          </td> -->
          <!-- <td>
            <textarea enhance json-transform ng-model="stim.context" class="json"></textarea>
          </td> -->
          <td ng-repeat="parameter in experiment.parameters">
            <span ng-bind="stim.context[parameter]"></span>
          </td>
          <td>
            <!-- <input ng-model="stim.view_order" type="number" style="width: 50px"> -->
            <span ng-bind="stim.view_order"></span>
          </td>
          <td class="nowrap">
            <!-- <button ng-click="previewStim(stim)">Preview</button> -->
            <a href="/experiments/{{experiment.id}}/stims/{{stim.id}}?workerId=testing">Public</a>
            <button ng-click="syncStim(stim, $event)">Save</button>
            <button ng-click="deleteStim(stim, $event)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      <button ng-click="addStim({})">+ empty row</button>
      <button ng-click="deleteSelectedStims()">- delete selection</button>
    </p>

    <div class="preview" ng-show="show_preview">
      <div class="controls"><span>&times;</span>Hide preview</div>
      <div class="content">
        <iframe></iframe>
      </div>
    </div>
  </main>
</div>
