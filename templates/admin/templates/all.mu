<main ng-controller="adminTableCtrl">
  <h3>Templates</h3>

  <section>
    <table class="striped lined padded fill">
      <thead>
        <tr>
          <th>Name</th>
          <th>HTML</th>
          <th>Created</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="template in table">
          <td title="{{template.id}}">
            <a href="/admin/templates/{{template.id}}">{{template.name}}</a>
          </td>
          <td><code>{{template.html.slice(0, 100)}}</code></td>
          <td><time>{{template.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <!-- angular being dumb about the action string -->
            <form method="POST" action="{{'/admin/templates/' + template.id + '/clone'}}">
              <button>Clone</button>
            </form>
          </td>
          <td>
            <ajaxform method="DELETE" action="/admin/templates/{{template.id}}">
              <button>Delete</button>
            </ajaxform>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <a href="/admin/templates/new">Create new template</a>
</main>
<script>
var table = <%& serialize(templates) %>;
</script>
