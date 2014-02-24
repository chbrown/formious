{{#user}}
<h3 class="section">User: {{_id}}</h3>

<section class="box">
  <form method="POST" action="/admin/users/{{_id}}" class="vform">
    <label><span>ID</span>
      <input name="_id" type="text" value="{{_id}}" style="width: 250px" />
    </label>

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

    <button>Save</button>
  </form>
</section>
{{/user}}
