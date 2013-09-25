<h3 class="section">
  {{#user.password}}Login{{/}}
  {{^user.password}}Claim{{/}}
</h3>

<section class="box">
  <form action="/users/login" method="POST" class="hform">
    <label><span>User</span>
      <input name="user_id" value="{{user._id}}" />
    </label>
    <label><span>Password</span>
      <input name="password" type="password" />
    </label>
    <button>Login</button>
  </form>
</section>
