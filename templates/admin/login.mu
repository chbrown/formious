<form action="/admin/login" method="POST" class="login vform">
  <h3>Admin</h3>
  <p><% message %></p>
  <label>
    <div><b>Email</b></div>
    <input name="email" value="<% email %>">
  </label>
  <label>
    <div><b>Password</b></div>
    <input type="password" name="password" value="<% password %>">
  </label>
  <button>Login</button>
</form>
