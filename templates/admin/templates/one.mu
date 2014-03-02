<script src="/static/lib/textarea.js"></script>

<div ng-controller="adminTemplateEditor">
  <nav fixedflow>
    Template: <b>{{template.name}}</b>
    <button ng-click="sync($event)" id="save_button">Save</button>
  </nav>

  <!-- <a href="clone">Clone</a> -->

  <main class="fill">
    <!-- <form method="PATCH" action="/admin/templates/{{template.id}}" class="vform"> -->
    <form ng-submit="" class="vform">
      <label><span>Name</span>
        <input type="text" ng-model="template.name" />
      </label>

      <label><span>Created</span>
        <time ng-model="template.created" class="datetime" />
      </label>

      <label><span>HTML</span>
        <textarea enhance ng-model="template.html" class="code" ng-keydown="keydown($event)"
          placeholder="HTML / Handlebars content" style="width: 100%; min-height: 200px;"></textarea>
      </label>

    </form>
  </main>
  <!-- <h3>HTML</h3> -->
  <!-- <pre>{ html }</pre> -->
</div>

<script>
var template = <%& serialize(template) %>;
</script>
