<main ng-controller="adminAccessTokensCtrl">
  <h3>Access Tokens</h3>

  <section>
    <table class="striped lined padded fill">
      <thead>
        <tr>
          <th>ID</th>
          <th>token</th>
          <th>relation / foreign id</th>
          <th>expires</th>
          <th>redacted</th>
          <th>created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="access_token in access_tokens">
          <td title="{{access_token.id}}">
            <a href="/admin/access_tokens/{{access_token.id}}">{{access_token.id}}</a>
          </td>
          <td>{{access_token.token}}</td>
          <td>
            <a href="/admin/{{access_token.relation}}/{{access_token.foreign_id}}">{{access_token.relation}}/{{access_token.foreign_id}}</a>
          </td>
          <td><time>{{access_token.expires | date:"yyyy-MM-dd"}}</time></td>
          <td><time>{{access_token.redacted | date:"yyyy-MM-dd"}}</time></td>
          <td><time>{{access_token.created | date:"yyyy-MM-dd"}}</time></td>
          <td>
            <button ng-click="delete($index)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- <a href="/admin/access_tokens/new">Create new access token</a> -->
</main>
