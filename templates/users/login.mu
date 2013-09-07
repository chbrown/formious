{{#user.password}}
<h3>Login as {{user._id}}</h3>
<form action="/admin/users/{{user._id}}/become" method="POST" class="hform">
  <label><span>Password</span> <input name="password" type="password" /></label>
  <button>Login</button>
</form>
{{/}}
{{^user.password}}
<h3>Claim {{user._id}}</h3>
<form action="/admin/users/{{user._id}}/claim" method="POST" class="hform">
  <label><span>Password</span> <input name="password" type="password" /></label>
  <button>Claim user</button>
</form>
{{/}}
