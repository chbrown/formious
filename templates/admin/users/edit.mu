{{#user}}
  <h3>User: {{_id}}</h3>
  <form method="POST" action="/admin/users/{{_id}}" class="vform">
    <label><span>Bonus paid</span>
      <input name="bonus_paid" type="text" value="{{bonus_paid}}" />
    </label>

    <label><span>Bonus owed</span>
      <input name="bonus_owed" type="text" value="{{bonus_owed}}" />
    </label>

    <label><span>Set password (leave blank to leave unchanged)</span>
      <input name="password" type="text" />
    </label>

    <label><span>Superuser</span></label>
    <label>
      <input name="superuser" type="radio" value="true" {{#superuser}}checked{{/}} />
      <span>True</span>
    </label>
    <label>
      <input name="superuser" type="radio" value="false" {{^superuser}}checked{{/}} />
      <span>False</span>
    </label>

    <button type="submit">Save</button>
  </form>
{{/user}}
