<form action="/admin/login" method="POST" class="login vform">
  <h3>Admin</h3>
  <p>{{message}}</p>
  <label><span>Email</span> <input name="email" value="{{email}}"></label>
  <label><span>Password</span> <input type="password" name="password" value="{{password}}"></label>
  <button>Login</button>
</form>
