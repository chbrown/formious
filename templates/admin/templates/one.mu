<div ng-controller="adminTemplateEditor">
  <nav fixedflow class="sub">
    <span>Template: <b>{{template.name}}</b></span>
    <button ng-click="sync($event)" id="save_button">Save</button>
  </nav>

  <main>
    <form>
      <label>
        <div><b>Name</b></div>
        <input type="text" ng-model="template.name" style="width: 100%;">
      </label>

      <label>
        <div><b>Created</b></div>
        <time ng-model="template.created" class="datetime"></time>
      </label>

      <label>
        <div><b>HTML</b></div>
        <textarea enhance ng-model="template.html" class="code" ng-keydown="keydown($event)"
          placeholder="HTML / Handlebars content" style="width: 100%; min-height: 200px;"></textarea>
      </label>

      <button ng-click="sync($event)">Save</button>
    </form>
  </main>
</div>

<script>
var template = <%& serialize(template) %>;
</script>
